import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6)
  const { product_categories } = await getCategoriesList(0, 6)

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
