import { EOL } from "os";

import {
  PaymentProviderError,
  PaymentProviderSessionResponse,
  ProviderWebhookPayload,
  WebhookActionResult,
  CreatePaymentProviderSession,
  UpdatePaymentProviderSession,
  MedusaContainer,
} from "@medusajs/framework/types";
import {
  AbstractPaymentProvider,
  isDefined,
  isPaymentProviderError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import { CreateOrder, PaypalSdk } from "../core";
import {
  PaypalOptions,
  PaypalOrder,
  PaypalOrderStatus,
  PurchaseUnits,
} from "../types";
import {
  getAmountFromSmallestUnit,
  getSmallestUnit,
} from "../utils/get-smallest-unit";

class PayPalProviderService extends AbstractPaymentProvider<PaypalOptions> {
  static identifier = "paypal";

  protected readonly options_: PaypalOptions;
  protected paypal_: PaypalSdk;
  protected container_: MedusaContainer;

  static validateOptions(options: PaypalOptions): void {
    if (!isDefined(options.clientSecret)) {
      throw new Error(
        "Required option `clientSecret` is missing in paypal plugin"
      );
    }
    if (!isDefined(options.clientId)) {
      throw new Error("Required option `clientId` is missing in paypal plugin");
    }
  }

  constructor(container: MedusaContainer, options: PaypalOptions) {
    // @ts-ignore
    super(...arguments);

    this.container_ = container;
    this.options_ = options;
    this.paypal_ = new PaypalSdk({
      ...this.options_,
    });
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    const order = (await this.retrievePayment(
      paymentSessionData
    )) as PaypalOrder;
    switch (order.status) {
      case PaypalOrderStatus.CREATED:
        return PaymentSessionStatus.PENDING;
      case PaypalOrderStatus.SAVED:
      case PaypalOrderStatus.APPROVED:
      case PaypalOrderStatus.PAYER_ACTION_REQUIRED:
        return PaymentSessionStatus.REQUIRES_MORE;
      case PaypalOrderStatus.VOIDED:
        return PaymentSessionStatus.CANCELED;
      case PaypalOrderStatus.COMPLETED:
        return PaymentSessionStatus.AUTHORIZED;
      default:
        return PaymentSessionStatus.PENDING;
    }
  }

  async initiatePayment(
    input: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { session_id } = input.context;
    const { currency_code, amount } = input;
    let session_data;

    try {
      const intent: CreateOrder["intent"] = this.options_.capture
        ? "CAPTURE"
        : "AUTHORIZE";

      session_data = await this.paypal_.createOrder({
        intent,
        purchase_units: [
          {
            custom_id: session_id,
            amount: {
              currency_code: currency_code.toUpperCase(),
              value: getSmallestUnit(amount, currency_code),
            },
          },
        ],
      });
    } catch (e) {
      return this.buildError("An error occurred in initiatePayment", e);
    }
    return {
      data: session_data,
    };
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<
    | PaymentProviderError
    | {
        status: PaymentSessionStatus;
        data: PaymentProviderSessionResponse["data"];
      }
  > {
    const status = await this.getPaymentStatus(paymentSessionData);
    return { data: paymentSessionData, status };
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    const order = (await this.retrievePayment(
      paymentSessionData
    )) as PaypalOrder;
    if (!order) return { data: undefined };

    const isAlreadyCanceled = order.status === PaypalOrderStatus.VOIDED;
    const isCanceledAndFullyRefund =
      order.status === PaypalOrderStatus.COMPLETED && !!order.invoice_id;

    if (isAlreadyCanceled || isCanceledAndFullyRefund) {
      return order;
    }

    try {
      const { purchase_units } = paymentSessionData as {
        purchase_units: PurchaseUnits;
      };
      const isAlreadyCaptured = purchase_units.some(
        (pu) => pu.payments.captures?.length
      );

      if (isAlreadyCaptured) {
        const payments = purchase_units[0].payments;

        const payId = payments.captures[0].id;
        await this.paypal_.refundPayment(payId);
      } else {
        const id = purchase_units[0].payments.authorizations[0].id;
        await this.paypal_.cancelAuthorizedPayment(id);
      }

      const data = (await this.retrievePayment(
        paymentSessionData
      )) as unknown as PaymentProviderSessionResponse["data"];
      return { data };
    } catch (error) {
      return this.buildError("An error occurred in cancelPayment", error);
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    const { purchase_units } = paymentSessionData as {
      purchase_units: PurchaseUnits;
    };

    const id = purchase_units[0].payments.authorizations[0].id;

    try {
      await this.paypal_.captureAuthorizedPayment(id);
      return await this.retrievePayment(paymentSessionData);
    } catch (error) {
      return this.buildError("An error occurred in capturePayment", error);
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    return await this.cancelPayment(paymentSessionData);
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    const { purchase_units } = paymentSessionData as {
      purchase_units: PurchaseUnits;
    };

    try {
      const purchaseUnit = purchase_units[0];
      const payments = purchaseUnit.payments;
      const isAlreadyCaptured = purchase_units.some(
        (pu) => pu.payments.captures?.length
      );

      if (!isAlreadyCaptured) {
        throw new Error("Cannot refund an uncaptured payment");
      }

      const paymentId = payments.captures[0].id;
      const currencyCode = purchaseUnit.amount.currency_code;
      await this.paypal_.refundPayment(paymentId, {
        amount: {
          currency_code: currencyCode,
          value: getSmallestUnit(refundAmount, currencyCode),
        },
      });

      return await this.retrievePayment(paymentSessionData);
    } catch (error) {
      return this.buildError("An error occurred in refundPayment", error);
    }
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    try {
      const id = paymentSessionData.id as string;
      if (!id) return undefined;
      const order = await this.paypal_.getOrder(id);
      return order as unknown as PaymentProviderSessionResponse["data"];
    } catch (e) {
      return this.buildError("An error occurred in retrievePayment", e);
    }
  }

  async updatePayment(
    input: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const { context, data, currency_code, amount } = input;

      const id = data.id as string;

      await this.paypal_.patchOrder(id, [
        {
          op: "replace",
          path: "/purchase_units/@reference_id=='default'",
          value: {
            amount: {
              currency_code: currency_code.toUpperCase(),
              value: getSmallestUnit(amount, currency_code),
            },
          },
        },
      ]);
      const session_data = (await this.retrievePayment(
        data
      )) as unknown as PaymentProviderSessionResponse["data"];

      return { data: session_data };
    } catch (e) {
      return this.buildError("An error occurred in updatePayment", e);
    }
  }
  //TODO
  async getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    console.info("getWebhookActionAndData : paypal-provider");
    console.debug(JSON.stringify(data, undefined, 2));
    throw new Error("Method not implemented.");
  }
  async verifyWebhook(data) {
    return await this.paypal_.verifyWebhook({
      webhook_id: this.options_.authWebhookId,
      ...data,
    });
  }

  protected buildError(
    message: string,
    e: PaymentProviderError | Error
  ): PaymentProviderError {
    return {
      error: message,
      code: "code" in e ? e.code : "",
      detail: isPaymentProviderError(e)
        ? `${e.error}${EOL}${e.detail ?? ""}`
        : e.message ?? "",
    };
  }
}

export default PayPalProviderService;
