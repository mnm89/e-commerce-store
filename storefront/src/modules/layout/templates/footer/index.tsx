import { Text } from "@medusajs/ui"

import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  return (
    <footer className="border-t border-ui-border-base w-full">
      <div className="flex w-full my-3 justify-between text-ui-fg-muted content-container">
        <Text className="txt-compact-small">
          © {new Date().getFullYear()} E-Commerce Store. All rights reserved.
        </Text>
        <MedusaCTA />
      </div>
    </footer>
  )
}
