/*
  Warnings:

  - You are about to drop the column `cart_item` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `product_image` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `products_tags_tags` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `variants` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `cart` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "cart_item",
DROP COLUMN "product_image",
DROP COLUMN "products_tags_tags",
DROP COLUMN "variants";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "cart",
DROP COLUMN "payment_method";

-- CreateTable
CREATE TABLE "product_image" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR NOT NULL,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "productId" INTEGER NOT NULL,
    "order_image" INTEGER NOT NULL,

    CONSTRAINT "PK_99d98a80f57857d51b5f63c8240" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_tags_tags" (
    "productsId" INTEGER NOT NULL,
    "tagsId" INTEGER NOT NULL,

    CONSTRAINT "PK_b06c7e3d7d74a176b4d936bcd73" PRIMARY KEY ("productsId","tagsId")
);

-- CreateTable
CREATE TABLE "slide_images" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR NOT NULL,
    "order_image" INTEGER NOT NULL DEFAULT 0,
    "slide_id" INTEGER NOT NULL,

    CONSTRAINT "PK_75744fd70f0d7fb5641c007cb29" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slides" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variants" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "price" DECIMAL(10,2),
    "stock" INTEGER NOT NULL,
    "imageUrl" VARCHAR,
    "productId" INTEGER,

    CONSTRAINT "PK_672d13d1a6de0197f20c6babb5e" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "cardholder_name" VARCHAR NOT NULL,
    "card_number" VARCHAR NOT NULL,
    "expiry_date" VARCHAR NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_snapshot" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IDX_72fa6ba0f176a89a2e9d90274c" ON "products_tags_tags"("tagsId");

-- CreateIndex
CREATE INDEX "IDX_88687975db5205fdbdb10969fc" ON "products_tags_tags"("productsId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_d90243459a697eadb8ad56e9092" ON "tags"("name");

-- AddForeignKey
ALTER TABLE "product_image" ADD CONSTRAINT "FK_40ca0cd115ef1ff35351bed8da2" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products_tags_tags" ADD CONSTRAINT "FK_72fa6ba0f176a89a2e9d90274c5" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products_tags_tags" ADD CONSTRAINT "FK_88687975db5205fdbdb10969fc4" FOREIGN KEY ("productsId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slide_images" ADD CONSTRAINT "FK_1b789565cad8631f65aa608d6ca" FOREIGN KEY ("slide_id") REFERENCES "slides"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "FK_bdbfe33a28befefa9723c355036" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_paymentmethod_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "FK_cart_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cartitem_cart" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cartitem_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
