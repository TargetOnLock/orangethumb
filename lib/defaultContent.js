function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 10);
}

const defaultContent = {
  brand: {
    name: "Orange Thumb",
    city: "West Salem, WI",
    address: "100 Leonard St S, West Salem, WI 54669",
    phone: "(608) 612-0093",
    tagline: "Where creativity never goes out of style.",
    logo: "/images/logo.jpg",
    facebook: "https://www.facebook.com/orangethumbws",
    yelp: "https://www.yelp.com/biz/orange-thumb-west-salem"
  },
  hours: [
    { day: "Monday", open: "Closed" },
    { day: "Tuesday", open: "10:00 AM - 4:00 PM" },
    { day: "Wednesday", open: "10:00 AM - 4:00 PM" },
    { day: "Thursday", open: "10:00 AM - 4:00 PM" },
    { day: "Friday", open: "10:00 AM - 4:00 PM" },
    { day: "Saturday", open: "10:00 AM - 4:00 PM" },
    { day: "Sunday", open: "Closed" }
  ],
  hero: {
    title: "Discover Handmade Treasures in Downtown West Salem",
    subtitle:
      "A trendy boutique featuring women's accessories, stunning jewelry, unique crafts, soaps, clothing, and more."
  },
  about: {
    heading: "About Orange Thumb",
    paragraphs: [
      "At the Orange Thumb, creativity never goes out of style. Each of our local artists has a creative thumb, and that is how we offer an incredible selection of handmade items every day.",
      "Orange is the color of creativity. Just like a green thumb, our artists carry a creative (orange) thumb. You will find something new with every visit.",
      "Whether shopping for yourself or surprising a friend with something special, Orange Thumb has it all. Stop by today for a shopping experience like no other."
    ]
  },
  highlightBlocks: [
    {
      id: cryptoRandomId(),
      type: "text",
      title: "Locally Made",
      body: "Handcrafted goods from local artists and makers."
    },
    {
      id: cryptoRandomId(),
      type: "text",
      title: "Style + Gift Ideas",
      body: "Boutique clothing, jewelry, and one-of-a-kind gift finds."
    }
  ],
  pageSections: [
    { id: "hero-main", type: "hero" },
    { id: "highlights-main", type: "highlights" },
    { id: "about-main", type: "about" },
    { id: "location-main", type: "locationHours" },
    { id: "gallery-main", type: "gallery" }
  ],
  mediaGallery: []
};

module.exports = { defaultContent, cryptoRandomId };
