/**
 * Seed script — creates realistic user accounts and product listings with images
 * for Nexus Reselling Platform.
 *
 * Usage: node scripts/seedRealisticData.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../db');
const User = require('../models/User');
const Category = require('../models/Category');
const Listing = require('../models/Listing');

const USERS = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    role: 'seller',
    phone: '+91 98450 12345',
    location: 'Indiranagar, Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    role: 'seller',
    phone: '+91 98201 54321',
    location: 'Bandra West, Mumbai',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Rohan Mehta',
    email: 'rohan.mehta@example.com',
    role: 'seller',
    phone: '+91 97402 98765',
    location: 'Koramangala, Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    role: 'seller',
    phone: '+91 94440 67890',
    location: 'Adyar, Chennai',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Vikramaditya Rao',
    email: 'vikram.rao@example.com',
    role: 'seller',
    phone: '+91 99890 23456',
    location: 'Jubilee Hills, Hyderabad',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Sneha Mukherjee',
    email: 'sneha.mukherjee@example.com',
    role: 'seller',
    phone: '+91 98310 34567',
    location: 'Salt Lake, Kolkata',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Kabir Verma',
    email: 'kabir.verma@example.com',
    role: 'seller',
    phone: '+91 98110 89012',
    location: 'Hauz Khas, New Delhi',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Neha Kulkarni',
    email: 'neha.kulkarni@example.com',
    role: 'seller',
    phone: '+91 98500 45678',
    location: 'Kothrud, Pune',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Dev Buyer',
    email: 'buyer@example.com',
    role: 'buyer',
    phone: '+91 98765 43210',
    location: 'Connaught Place, New Delhi',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
  }
];

const RAW_PRODUCTS = [
  {
    title: 'Apple iPhone 14 Pro - 128GB Deep Purple (Battery 91%)',
    categorySlug: 'mobiles',
    sellerEmail: 'aarav.sharma@example.com',
    price: 62000,
    condition: 'like-new',
    location: 'Indiranagar, Bengaluru',
    description: `Selling my iPhone 14 Pro 128GB in Deep Purple. Battery health is at 91%. Handled with care in a Spigen case and tempered glass since day 1. Zero scratches or dents on screen or back.

Includes:
- Original Apple box & documentation
- Unused braided USB-C to Lightning cable
- 2 extra Spigen Ultra Hybrid cases
- Original invoice copy

Reason for selling: Upgraded to iPhone 16 Pro.
Prefer face-to-face deal in Indiranagar/MG Road or verified shipping.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-iphone-14-pro-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-iphone-14-pro-2',
      },
    ],
  },
  {
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Silver)',
    categorySlug: 'electronics',
    sellerEmail: 'rohan.mehta@example.com',
    price: 19500,
    condition: 'like-new',
    location: 'Koramangala, Bengaluru',
    description: `Sony WH-1000XM5 in pristine silver finish. Purchased 5 months back from Reliance Digital. Incredible active noise cancellation and 30-hour battery life.

Used only for occasional flights and indoor work calls. Clean headband and pristine ear cushions.

Comes with:
- Original hardshell magnetic carry case
- 3.5mm gold-plated aux cable
- USB-C fast charging cable
- Original retail invoice with 7 months manufacturer warranty remaining.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-sony-xm5-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-sony-xm5-2',
      },
    ],
  },
  {
    title: 'MacBook Pro 14" (M2 Pro, 16GB RAM, 512GB SSD) - Space Grey',
    categorySlug: 'electronics',
    sellerEmail: 'ananya.iyer@example.com',
    price: 128000,
    condition: 'like-new',
    location: 'Adyar, Chennai',
    description: `Apple MacBook Pro 14-inch (2023, M2 Pro 10-core CPU, 16-core GPU, 16GB Unified Memory, 512GB High-Speed SSD). Liquid Retina XDR display with ProMotion 120Hz refresh rate.

Battery cycle count: 48 cycles (100% maximum capacity health).
Pristine cosmetic condition, no keyboard shine, body dents, or screen marks.

Includes:
- Original 67W MagSafe 3 power adapter
- Braided Space Grey USB-C to MagSafe cable
- Original box and invoice

Selling as company provided a new work machine.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-macbook-pro-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-macbook-pro-2',
      },
    ],
  },
  {
    title: 'Fujifilm X-T4 Mirrorless Camera with XF 18-55mm f/2.8-4 Lens',
    categorySlug: 'electronics',
    sellerEmail: 'kabir.verma@example.com',
    price: 89000,
    condition: 'good',
    location: 'Hauz Khas, New Delhi',
    description: `Fujifilm X-T4 Body (Black) along with the versatile Fujinon XF 18-55mm f/2.8-4 R LM OIS zoom lens. Shutter count is around 11,400 (rated for 300,000).

Features 5-axis in-body image stabilization (IBIS), gorgeous Fuji film simulations (Classic Chrome, Nostalgic Neg, Eterna), and 4K 60fps 10-bit video.

Package includes:
- 2 original NP-W235 batteries
- Dual slot external charger
- Lens petal hood & Hoya UV filter
- SanDisk Extreme Pro 128GB 200MB/s SD card

Minor cosmetic paint wear near strap lugs; sensor and optics are 100% spotless.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-fuji-xt4-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-fuji-xt4-2',
      },
    ],
  },
  {
    title: 'Royal Enfield Himalayan 411 (2022 BS6) - Pine Green Edition',
    categorySlug: 'vehicles',
    sellerEmail: 'vikram.rao@example.com',
    price: 175000,
    condition: 'good',
    location: 'Jubilee Hills, Hyderabad',
    description: `Royal Enfield Himalayan BS6 (Pine Green edition), single owner, March 2022 registered.
Odometer: 14,200 km. Timely serviced at Royal Enfield Authorized Service Center with full records.

Loaded with high quality touring accessories worth ₹25k+:
- Moto Torque engine crash guard with sliders
- Zana heavy-duty top rack and saddle stays
- Barkbusters original aluminium handguards
- Touring tall tinted windscreen

Both tyres in great shape (Metzeler Tourance), valid comprehensive insurance until late 2027. RC transfer mandatory.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-himalayan-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-himalayan-2',
      },
    ],
  },
  {
    title: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard (Gateron Red)',
    categorySlug: 'electronics',
    sellerEmail: 'rohan.mehta@example.com',
    price: 12500,
    condition: 'like-new',
    location: 'Koramangala, Bengaluru',
    description: `Keychron Q1 Pro QMK/VIA Wireless Custom Mechanical Keyboard (Carbon Black, Fully Assembled with factory-lubed Gateron Jupiter Red linear switches).

Full CNC machined aluminum body, double-gasket mount design, acoustic sound-absorbing foam, south-facing RGB, hot-swappable PCB.
Bluetooth 5.1 and Type-C wired modes with instant Mac/Windows layout toggle switch.

Used lightly for 2 months, sounds deep and creamy. Comes with all extra Mac/Win OSA profile keycaps, switch puller, keycap puller, and custom coiled aviator cable.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-keychron-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-keychron-2',
      },
    ],
  },
  {
    title: 'Herman Miller Aeron Ergonomic Chair (Size B, Fully Loaded)',
    categorySlug: 'furniture',
    sellerEmail: 'aarav.sharma@example.com',
    price: 48000,
    condition: 'good',
    location: 'Indiranagar, Bengaluru',
    description: `Original Herman Miller Aeron Remastered chair in Graphite mineral finish. Size B (Medium).

Features:
- PostureFit SL dual-pad adjustable lumbar support
- Fully adjustable 3D armrests (height, depth, pivot angle)
- Forward tilt mechanism and tilt limiter with tension adjustment
- Hard floor quiet caster wheels

Pellicle breathable mesh is tight and free of any tears, stains, or sagging.
Best ergonomic chair for long remote work hours. Pick up from Indiranagar.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-herman-miller-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-herman-miller-2',
      },
    ],
  },
  {
    title: 'Trek FX 3 Disc Hybrid Bicycle (Size M / Matte Dnister Black)',
    categorySlug: 'vehicles',
    sellerEmail: 'sneha.mukherjee@example.com',
    price: 34000,
    condition: 'good',
    location: 'Salt Lake, Kolkata',
    description: `Trek FX 3 Disc performance hybrid bicycle. Lightweight Alpha Gold Aluminum frame with Bontrager carbon fork.

- Shimano Deore 1x10 wide-range drivetrain
- Shimano hydraulic disc brakes with instant stopping power in all weather conditions
- Bontrager IsoZone vibration-dampening handlebar grips
- Hard-Case Lite puncture-resistant tires

Ridden approximately 600km on city roads. Regularly lubricated with Muc-Off dry lube.
Bonus: Free Decathlon helmet and heavy-duty U-lock included.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-trek-bike-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-trek-bike-2',
      },
    ],
  },
  {
    title: 'Sony PlayStation 5 Disc Edition + 2 Controllers + 3 Games',
    categorySlug: 'electronics',
    sellerEmail: 'priya.patel@example.com',
    price: 41000,
    condition: 'like-new',
    location: 'Bandra West, Mumbai',
    description: `Sony PS5 (CFI-1208A Disc version) in mint, dust-free condition. Barely used due to busy work schedule.

Includes:
- 2x Original DualSense Wireless Controllers (White & Midnight Black)
- 3 Physical PS5 Game Discs: God of War Ragnarok, Marvel's Spider-Man 2, and Horizon Forbidden West
- HDMI 2.1 ultra-speed cable, power cord, and vertical stand
- Original box packaging and bill from Croma (Nov 2023 purchase).

Zero stick drift on both controllers, whisper quiet cooling fans.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-ps5-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-ps5-2',
      },
    ],
  },
  {
    title: 'Nike Air Jordan 1 Retro High OG "Chicago Lost & Found" (UK 9)',
    categorySlug: 'fashion',
    sellerEmail: 'neha.kulkarni@example.com',
    price: 18500,
    condition: 'new',
    location: 'Kothrud, Pune',
    description: `100% Authentic Nike Air Jordan 1 High OG "Lost & Found" (Chicago colorway).
Size: UK 9 / US 10 / EU 44.

Deadstock / Brand New In Box (unworn, never stepped on pavement, laced only for photoshoot).
Purchased directly from SNKRS drop with verified order receipt and authentication tag from Mainstreet.

Comes with vintage-style aged receipt paper, mismatch box lid, sales invoice, and extra black/white laces.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-jordan1-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-jordan1-2',
      },
    ],
  },
  {
    title: 'Yamaha FG800 Solid Top Acoustic Guitar + Padded Gig Bag',
    categorySlug: 'books-hobbies',
    sellerEmail: 'kabir.verma@example.com',
    price: 9800,
    condition: 'like-new',
    location: 'Hauz Khas, New Delhi',
    description: `Yamaha FG800 dreadnought acoustic guitar with solid Sitka spruce top and nato/okume back and sides.
Produces warm, rich, and resonant acoustic projection with Yamaha's scalloped bracing design.

Set up with low, comfortable string action and strung with fresh D'Addario EXP16 coated phosphor bronze strings.
Includes heavy padded Yamaha gig bag, Snark clip-on digital tuner, Alice capo, and assorted Dunlop picks. Perfect for both beginners and seasoned players.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-yamaha-guitar-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-yamaha-guitar-2',
      },
    ],
  },
  {
    title: 'Solid Sheesham Wood 6-Seater Dining Table Set',
    categorySlug: 'furniture',
    sellerEmail: 'vikram.rao@example.com',
    price: 22000,
    condition: 'good',
    location: 'Jubilee Hills, Hyderabad',
    description: `Pure Solid Sheesham (Indian Rosewood) dining table with 6 cushioned high-back chairs in rich teak walnut finish.
Dimensions: 5ft length x 3ft width x 30in height. Very sturdy, heavy handcrafted woodwork with beautiful natural wood grain pattern.

Chair cushions upholstered in washable beige fabric.
Minor surface signs of usage on table edge, easily polishable. Selling because renovating dining area to open kitchen concept.
Buyer arranges pickup from Jubilee Hills.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-dining-table-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-dining-table-2',
      },
    ],
  },
  {
    title: 'Seiko 5 Sports Automatic Watch (SRPD55K1 - Black Dial Diver)',
    categorySlug: 'fashion',
    sellerEmail: 'aarav.sharma@example.com',
    price: 17200,
    condition: 'like-new',
    location: 'Indiranagar, Bengaluru',
    description: `Seiko 5 Sports Automatic (ref: SRPD55K1) with classic black dial and stainless steel oyster bracelet.

- In-house 4R36 automatic movement with 41hr power reserve, hand-winding, and hacking
- 100m water resistance with unidirectional rotating ceramic-feel bezel
- Lumibrite glowing hands and indices for bright night visibility
- Day-date complication at 3 o'clock

Bought from Ethos Watch Boutiques in early 2024. Worn rarely in rotation.
Comes with full retail box, stamped warranty card, instruction manual, and extra bracelet links.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-seiko-watch-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-seiko-watch-2',
      },
    ],
  },
  {
    title: 'DJI Mini 3 Pro Fly More Combo Drone (DJI RC Controller)',
    categorySlug: 'electronics',
    sellerEmail: 'priya.patel@example.com',
    price: 68000,
    condition: 'like-new',
    location: 'Bandra West, Mumbai',
    description: `DJI Mini 3 Pro Fly More Combo featuring the built-in screen DJI RC smart controller. Sub-249g ultra lightweight form factor.

Features 4K HDR 60fps video, true vertical shooting for Instagram/TikTok reels, tri-directional obstacle avoidance sensors, and MasterShots auto modes.

Combo includes:
- DJI Mini 3 Pro drone
- DJI RC Remote Controller with FHD screen
- 3x Intelligent Flight Batteries (battery cycles: 8, 9, 11)
- Two-way charging hub & shoulder travel case
- Extra propeller sets and gimbal guard

Never crashed, pristine scratch-free lens.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-dji-drone-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-dji-drone-2',
      },
    ],
  },
  {
    title: 'Samsung Galaxy S23 Ultra 5G - 256GB Phantom Black',
    categorySlug: 'mobiles',
    sellerEmail: 'rohan.mehta@example.com',
    price: 66000,
    condition: 'like-new',
    location: 'Koramangala, Bengaluru',
    description: `Samsung Galaxy S23 Ultra 5G (Phantom Black, 12GB RAM / 256GB Storage, Snapdragon 8 Gen 2 for Galaxy).

200MP camera system with 100x Space Zoom, built-in S-Pen stylus, Dynamic AMOLED 2X 120Hz display with 1750 nits peak brightness.

Flawless condition without micro-scratches or scuffs. Ringke Fusion Matte case and pre-installed UV curved tempered glass protector included.
Original box, SIM ejector tool, Type-C to Type-C cable, and Amazon India tax invoice provided.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-s23-ultra-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-s23-ultra-2',
      },
    ],
  },
  {
    title: 'Canon EOS R6 Mark II Mirrorless Camera (Body Only)',
    categorySlug: 'electronics',
    sellerEmail: 'kabir.verma@example.com',
    price: 165000,
    condition: 'like-new',
    location: 'Hauz Khas, New Delhi',
    description: `Canon EOS R6 Mark II 24.2MP Full-Frame Mirrorless camera body.

Blazing fast Dual Pixel CMOS AF II with deep learning AI subject tracking for animals, vehicles, and humans. 40fps electronic continuous shooting, 6K oversampled 4K 60p uncropped video.

Low shutter count (< 6,200 actuations). Screen protector on rear vari-angle LCD since day 1.
Includes 2 LP-E6NH batteries, Canon dedicated charger, neck strap, and original retail box.`,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-canon-r6-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
        publicId: 'seed-canon-r6-2',
      },
    ],
  },
];

async function seedData() {
  await connectDB();

  console.log('--- Seeding Realistic Users & Products ---');

  // Fetch or create categories
  const categories = await Category.find();
  const categoryMap = {};
  for (const cat of categories) {
    categoryMap[cat.slug] = cat._id;
  }

  // 1. Create / Update Users
  const userMap = {};

  for (const userData of USERS) {
    let user = await User.findOne({ email: userData.email });
    if (!user) {
      user = new User({
        name: userData.name,
        email: userData.email,
        password: 'Password@123',
        role: userData.role,
        phone: userData.phone,
        location: userData.location,
        avatarUrl: userData.avatarUrl,
      });
      await user.save();
      console.log(`  ✔ Created user: ${user.name} (${user.email})`);
    } else {
      user.name = userData.name;
      user.role = userData.role;
      user.phone = userData.phone;
      user.location = userData.location;
      user.avatarUrl = userData.avatarUrl;
      await user.save();
      console.log(`  ↻ Updated user: ${user.name} (${user.email})`);
    }
    userMap[userData.email] = user._id;
  }

  // 2. Add / Update Listings
  console.log('\n--- Creating Product Listings ---');
  let createdCount = 0;

  for (const item of RAW_PRODUCTS) {
    const categoryId = categoryMap[item.categorySlug];
    const sellerId = userMap[item.sellerEmail];

    if (!categoryId) {
      console.warn(`  ⚠ Warning: Category '${item.categorySlug}' not found!`);
      continue;
    }
    if (!sellerId) {
      console.warn(`  ⚠ Warning: Seller '${item.sellerEmail}' not found!`);
      continue;
    }

    // Upsert listing by title and seller
    const existing = await Listing.findOne({ title: item.title, seller: sellerId });
    if (existing) {
      existing.description = item.description;
      existing.price = item.price;
      existing.category = categoryId;
      existing.condition = item.condition;
      existing.images = item.images;
      existing.location = item.location;
      existing.status = 'active';
      await existing.save();
      console.log(`  ↻ Updated listing: "${item.title}"`);
    } else {
      await Listing.create({
        title: item.title,
        description: item.description,
        price: item.price,
        category: categoryId,
        condition: item.condition,
        images: item.images,
        location: item.location,
        seller: sellerId,
        status: 'active',
      });
      console.log(`  ✔ Created listing: "${item.title}" (₹${item.price.toLocaleString('en-IN')})`);
      createdCount++;
    }
  }

  console.log(`\n✅ Finished seeding! Added/updated ${RAW_PRODUCTS.length} realistic products across ${USERS.length} accounts.`);
  await mongoose.disconnect();
}

seedData().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
