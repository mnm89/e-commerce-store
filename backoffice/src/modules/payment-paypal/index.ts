import { Modules, ModuleProvider } from "@medusajs/framework/utils";
import PaypalProviderService from "./services/paypal-provider";

export default ModuleProvider(Modules.PAYMENT, {
  services: [PaypalProviderService],
});
