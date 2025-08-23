import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.users.findFirst({
    where: {
      email: 'admin@myshop.com',
    },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping...');
  } else {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Create admin user
    const adminUser = await prisma.users.create({
      data: {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@myshop.com',
        hashed_password: hashedPassword,
        role_id: '1', // ADMIN role
        is_active: true,
        phone_number: '0812345678',
        note: 'Default admin user created by seed',
      },
    });

    console.log('✅ Admin user created successfully:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role_id,
    });
  }

  // Create supervisor user
  const existingSupervisor = await prisma.users.findFirst({
    where: {
      email: 'supervisor@myshop.com',
    },
  });

  if (!existingSupervisor) {
    const supervisorPassword = await bcrypt.hash('supervisor123', 10);

    const supervisorUser = await prisma.users.create({
      data: {
        first_name: 'Supervisor',
        last_name: 'User',
        email: 'supervisor@myshop.com',
        hashed_password: supervisorPassword,
        role_id: '2', // SUPERVISOR role
        is_active: true,
        phone_number: '0812345679',
        note: 'Default supervisor user created by seed',
      },
    });

    console.log('✅ Supervisor user created successfully:', {
      id: supervisorUser.id,
      email: supervisorUser.email,
      role: supervisorUser.role_id,
    });
  }

  // Create sample member user
  const existingMember = await prisma.users.findFirst({
    where: {
      email: 'member@myshop.com',
    },
  });

  if (!existingMember) {
    const memberPassword = await bcrypt.hash('member123', 10);

    const memberUser = await prisma.users.create({
      data: {
        first_name: 'Member',
        last_name: 'User',
        email: 'member@myshop.com',
        hashed_password: memberPassword,
        role_id: '3', // MEMBER role
        is_active: true,
        phone_number: '0812345680',
        note: 'Default member user created by seed',
      },
    });

    console.log('✅ Member user created successfully:', {
      id: memberUser.id,
      email: memberUser.email,
      role: memberUser.role_id,
    });
  }

  console.log('🎉 User seed completed successfully!');

  // ===== PRODUCT SEED =====
  console.log('\n🛍️ Starting product seed...');

  // Create Categories (Shop by Room)
  const categories = [
    {
      name: 'ห้องนั่งเล่น',
      description: 'เฟอร์นิเจอร์และของตกแต่งสำหรับห้องนั่งเล่น',
      link: 'living-room',
      order: 1,
    },
    {
      name: 'ห้องนอน',
      description: 'เฟอร์นิเจอร์และของตกแต่งสำหรับห้องนอน',
      link: 'bedroom',
      order: 2,
    },
    {
      name: 'ห้องครัว',
      description: 'อุปกรณ์และเฟอร์นิเจอร์สำหรับห้องครัว',
      link: 'kitchen',
      order: 3,
    },
    {
      name: 'ห้องน้ำ',
      description: 'อุปกรณ์และของตกแต่งสำหรับห้องน้ำ',
      link: 'bathroom',
      order: 4,
    },
    {
      name: 'ห้องทำงาน',
      description: 'เฟอร์นิเจอร์และอุปกรณ์สำหรับห้องทำงาน',
      link: 'office',
      order: 5,
    },
    {
      name: 'สวนและระเบียง',
      description: 'เฟอร์นิเจอร์และของตกแต่งสำหรับสวนและระเบียง',
      link: 'garden',
      order: 6,
    },
  ];

  const createdCategories: any[] = [];
  for (const categoryData of categories) {
    const existingCategory = await prisma.category.findFirst({
      where: { name: categoryData.name },
    });

    if (!existingCategory) {
      const category = await prisma.category.create({
        data: categoryData,
      });
      createdCategories.push(category);
      console.log(`✅ Category created: ${category.name}`);
    } else {
      createdCategories.push(existingCategory);
      console.log(`ℹ️ Category already exists: ${existingCategory.name}`);
    }
  }

  // Create Tags
  const tags = [
    'ใหม่',
    'ขายดี',
    'ลดราคา',
    'ยอดนิยม',
    'มินิมอล',
    'สไตล์สแกนดิเนเวียน',
    'สไตล์โมเดิร์น',
    'สไตล์คลาสสิก',
    'ไม้ธรรมชาติ',
    'โลหะ',
    'ผ้า',
    'แก้ว',
    'เซรามิก',
    'LED',
    'ประหยัดพลังงาน',
  ];

  const createdTags: any[] = [];
  for (const tagName of tags) {
    const existingTag = await prisma.tags.findFirst({
      where: { name: tagName },
    });

    if (!existingTag) {
      const tag = await prisma.tags.create({
        data: { name: tagName },
      });
      createdTags.push(tag);
      console.log(`✅ Tag created: ${tag.name}`);
    } else {
      createdTags.push(existingTag);
      console.log(`ℹ️ Tag already exists: ${existingTag.name}`);
    }
  }

  // Create Products (Home & Furniture)
  const products = [
    {
      name: 'โซฟา 3 ที่นั่ง สไตล์โมเดิร์น',
      description:
        'โซฟา 3 ที่นั่งเนื้อผ้าคุณภาพสูง สีเทา สไตล์โมเดิร์น เหมาะสำหรับห้องนั่งเล่น',
      price: 15900.0,
      discount_price: 12900.0,
      stock: 15,
      sku: 'SOFA-001',
      brand: 'HomeStyle',
      is_best_seller: true,
      additional_information: 'เนื้อผ้าโพลีเอสเตอร์, โครงไม้สน, ฟองน้ำหนาแน่น',
      design: '3 ที่นั่ง, สีเทา, สไตล์โมเดิร์น',
      categoryIndex: 0, // ห้องนั่งเล่น
      tags: ['ขายดี', 'สไตล์โมเดิร์น', 'ผ้า'],
    },
    {
      name: 'โต๊ะกาแฟไม้ธรรมชาติ',
      description:
        'โต๊ะกาแฟไม้ธรรมชาติสีน้ำตาล สไตล์สแกนดิเนเวียน ทรงสี่เหลี่ยม',
      price: 4500.0,
      discount_price: 3500.0,
      stock: 25,
      sku: 'COFFEE-TABLE-001',
      brand: 'WoodCraft',
      is_best_seller: false,
      additional_information: 'ไม้สนแท้, แลคเกอร์ใส, ขนาด 120x60x45 ซม.',
      design: 'ทรงสี่เหลี่ยม, สีน้ำตาล, ไม้ธรรมชาติ',
      categoryIndex: 0, // ห้องนั่งเล่น
      tags: ['ไม้ธรรมชาติ', 'สไตล์สแกนดิเนเวียน', 'มินิมอล'],
    },
    {
      name: 'เตียงนอนคู่พร้อมที่นอน',
      description: 'เตียงนอนคู่ขนาด 5 ฟุต พร้อมที่นอนคุณภาพสูง สไตล์คลาสสิก',
      price: 25000.0,
      discount_price: 19900.0,
      stock: 10,
      sku: 'BED-001',
      brand: 'SleepWell',
      is_best_seller: true,
      additional_information: 'เตียง 5 ฟุต, ที่นอนสปริง, ผ้าปูที่นอนรวม',
      design: 'เตียงคู่, สีขาว, สไตล์คลาสสิก',
      categoryIndex: 1, // ห้องนอน
      tags: ['ขายดี', 'สไตล์คลาสสิก', 'ยอดนิยม'],
    },
    {
      name: 'ตู้เสื้อผ้า 3 บาน',
      description: 'ตู้เสื้อผ้า 3 บานสีขาว สไตล์โมเดิร์น มีกระจกและชั้นวาง',
      price: 8900.0,
      discount_price: 6900.0,
      stock: 20,
      sku: 'WARDROBE-001',
      brand: 'StorageMax',
      is_best_seller: false,
      additional_information: '3 บาน, มีกระจก, ชั้นวางหลายชั้น, ไม้ MDF',
      design: '3 บาน, สีขาว, มีกระจก',
      categoryIndex: 1, // ห้องนอน
      tags: ['สไตล์โมเดิร์น', 'มินิมอล', 'ลดราคา'],
    },
    {
      name: 'ชุดครัวสแตนเลส 5 ชิ้น',
      description:
        'ชุดครัวสแตนเลส 5 ชิ้น ประกอบด้วยหม้อ กระทะ และเครื่องครัวพื้นฐาน',
      price: 3500.0,
      discount_price: 2500.0,
      stock: 30,
      sku: 'KITCHEN-SET-001',
      brand: 'KitchenPro',
      is_best_seller: true,
      additional_information: 'สแตนเลส 304, 5 ชิ้น, ปลอดภัยสำหรับอาหาร',
      design: 'สแตนเลส, 5 ชิ้น, สีเงิน',
      categoryIndex: 2, // ห้องครัว
      tags: ['โลหะ', 'ขายดี', 'ลดราคา'],
    },
    {
      name: 'เครื่องปั่นน้ำผลไม้',
      description: 'เครื่องปั่นน้ำผลไม้กำลังสูง 1000W สีแดง สไตล์โมเดิร์น',
      price: 1800.0,
      discount_price: 1200.0,
      stock: 50,
      sku: 'BLENDER-001',
      brand: 'BlendMaster',
      is_best_seller: false,
      additional_information: 'กำลัง 1000W, ภาชนะแก้ว, ใบมีดสแตนเลส',
      design: 'สีแดง, สไตล์โมเดิร์น, ภาชนะแก้ว',
      categoryIndex: 2, // ห้องครัว
      tags: ['แก้ว', 'สไตล์โมเดิร์น', 'ลดราคา'],
    },
    {
      name: 'ชุดห้องน้ำเซรามิก',
      description:
        'ชุดห้องน้ำเซรามิกสีขาว ประกอบด้วยโถส้วม อ่างล้างหน้า และก๊อกน้ำ',
      price: 8500.0,
      discount_price: 6500.0,
      stock: 12,
      sku: 'BATHROOM-SET-001',
      brand: 'BathLux',
      is_best_seller: false,
      additional_information: 'เซรามิกคุณภาพสูง, สีขาว, ครบชุด',
      design: 'เซรามิก, สีขาว, ครบชุด',
      categoryIndex: 3, // ห้องน้ำ
      tags: ['เซรามิก', 'มินิมอล', 'ลดราคา'],
    },
    {
      name: 'โต๊ะทำงานไม้',
      description:
        'โต๊ะทำงานไม้ธรรมชาติสีน้ำตาล สไตล์มินิมอล เหมาะสำหรับห้องทำงาน',
      price: 3200.0,
      discount_price: 2500.0,
      stock: 35,
      sku: 'DESK-001',
      brand: 'WorkSpace',
      is_best_seller: true,
      additional_information: 'ไม้สนแท้, ขนาด 120x60x75 ซม., มีลิ้นชัก',
      design: 'ไม้ธรรมชาติ, สีน้ำตาล, มีลิ้นชัก',
      categoryIndex: 4, // ห้องทำงาน
      tags: ['ไม้ธรรมชาติ', 'มินิมอล', 'ขายดี'],
    },
    {
      name: 'เก้าอี้ทำงานหมุนได้',
      description: 'เก้าอี้ทำงานหมุนได้สีดำ สไตล์เออร์โกโนมิกส์ นั่งสบาย',
      price: 2800.0,
      discount_price: 2200.0,
      stock: 40,
      sku: 'OFFICE-CHAIR-001',
      brand: 'ErgoChair',
      is_best_seller: false,
      additional_information: 'เออร์โกโนมิกส์, หมุนได้, ปรับความสูงได้',
      design: 'สีดำ, เออร์โกโนมิกส์, หมุนได้',
      categoryIndex: 4, // ห้องทำงาน
      tags: ['สไตล์โมเดิร์น', 'ลดราคา', 'ยอดนิยม'],
    },
    {
      name: 'ชุดโต๊ะเก้าอี้สวน',
      description: 'ชุดโต๊ะเก้าอี้สวนไม้สน 4 ที่นั่ง สไตล์ธรรมชาติ',
      price: 5500.0,
      discount_price: 4200.0,
      stock: 18,
      sku: 'GARDEN-SET-001',
      brand: 'GardenLife',
      is_best_seller: false,
      additional_information: 'ไม้สนทนทาน, 4 ที่นั่ง, กันแดดกันฝน',
      design: 'ไม้สน, 4 ที่นั่ง, สีน้ำตาล',
      categoryIndex: 5, // สวนและระเบียง
      tags: ['ไม้ธรรมชาติ', 'สไตล์ธรรมชาติ', 'ลดราคา'],
    },
    {
      name: 'โคมไฟ LED สวน',
      description: 'โคมไฟ LED สวนพลังงานแสงอาทิตย์ สีขาว สไตล์โมเดิร์น',
      price: 1200.0,
      discount_price: 800.0,
      stock: 60,
      sku: 'GARDEN-LIGHT-001',
      brand: 'SolarLight',
      is_best_seller: true,
      additional_information: 'พลังงานแสงอาทิตย์, LED, กันน้ำ IP65',
      design: 'สีขาว, สไตล์โมเดิร์น, LED',
      categoryIndex: 5, // สวนและระเบียง
      tags: ['LED', 'ประหยัดพลังงาน', 'ขายดี'],
    },
  ];

  for (const productData of products) {
    const existingProduct = await prisma.products.findFirst({
      where: { sku: productData.sku },
    });

    if (!existingProduct) {
      const category = createdCategories[productData.categoryIndex];

      const product = await prisma.products.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          discount_price: productData.discount_price,
          stock: productData.stock,
          sku: productData.sku,
          brand: productData.brand,
          is_best_seller: productData.is_best_seller,
          additional_information: productData.additional_information,
          design: productData.design,
          category_id: category.id,
        },
      });

      // Create product images (placeholder)
      await prisma.product_image.create({
        data: {
          url: ``,
          is_main: true,
          productId: product.id,
          order_image: 1,
        },
      });

      // Create product tags
      for (const tagName of productData.tags) {
        const tag = createdTags.find((t) => t.name === tagName);
        if (tag) {
          await prisma.products_tags_tags.create({
            data: {
              productsId: product.id,
              tagsId: tag.id,
            },
          });
        }
      }

      // Create variants for some products
      if (productData.sku === 'SOFA-001') {
        const colors = ['สีเทา', 'สีน้ำตาล', 'สีดำ'];
        for (let i = 0; i < colors.length; i++) {
          await prisma.variants.create({
            data: {
              name: colors[i],
              price: productData.discount_price || productData.price,
              stock: Math.floor(productData.stock / colors.length),
              productId: product.id,
            },
          });
        }
      }

      console.log(`✅ Product created: ${product.name} (SKU: ${product.sku})`);
    } else {
      console.log(
        `ℹ️ Product already exists: ${existingProduct.name} (SKU: ${existingProduct.sku})`,
      );
    }
  }

  console.log('🎉 All seeds completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
