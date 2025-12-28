import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Firebase config - same as in your firebase.ts
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "selnet-ab187.firebaseapp.com",
  projectId: "selnet-ab187",
  storageBucket: "selnet-ab187.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testSignals = [
  {
    title: "Дупка на главния път",
    desc: "Голяма дупка на главния път към центъра, опасна за автомобилите",
    type: "път",
    status: "new",
    settlementId: "София",
    authorUid: "test-user-1",
    anonymous: false,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 86400000
  },
  {
    title: "Счупена улична лампа",
    desc: "Уличната лампа на ул. Васил Левски не работи от седмица",
    type: "осветление",
    status: "in_progress",
    settlementId: "Пловдив",
    authorUid: "test-user-2",
    anonymous: false,
    createdAt: Date.now() - 172800000, // 2 days ago
    updatedAt: Date.now() - 86400000
  },
  {
    title: "Замърсен парк",
    desc: "Паркът до училището е пълен с боклуци и се нуждае от почистване",
    type: "чистота",
    status: "new",
    settlementId: "Варна",
    anonymous: true,
    createdAt: Date.now() - 259200000, // 3 days ago
    updatedAt: Date.now() - 259200000
  }
];

const testIdeas = [
  {
    title: "Велосипедна алея в центъра",
    desc: "Предлагам създаване на велосипедна алея по главната улица за по-безопасно движение на велосипедистите",
    settlementId: "София",
    authorUid: "test-user-1",
    votesCount: 15,
    status: "hot",
    createdAt: Date.now() - 432000000, // 5 days ago
    updatedAt: Date.now() - 86400000
  },
  {
    title: "Детска площадка в кв. Център",
    desc: "В квартал Център няма детска площадка. Предлагам да се направи една в парка до библиотеката",
    settlementId: "Пловдив",
    authorUid: "test-user-2",
    votesCount: 8,
    status: "new",
    createdAt: Date.now() - 345600000, // 4 days ago
    updatedAt: Date.now() - 345600000
  },
  {
    title: "Повече кошчета за боклук",
    desc: "Предлагам поставяне на повече кошчета за боклук по улиците, особено около училищата",
    settlementId: "Варна",
    authorUid: "test-user-3",
    votesCount: 23,
    status: "accepted",
    createdAt: Date.now() - 604800000, // 7 days ago
    updatedAt: Date.now() - 172800000
  }
];

const testEvents = [
  {
    title: "Почистване на парка",
    desc: "Доброволческа акция за почистване на централния парк. Елате с ръкавици и торбички!",
    when: Date.now() + 604800000, // 7 days from now
    where: "Централен парк, до фонтана",
    settlementId: "София",
    createdBy: "test-user-1",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    title: "Събрание на жителите",
    desc: "Месечно събрание за обсъждане на проблемите в квартала и предстоящите проекти",
    when: Date.now() + 1209600000, // 14 days from now
    where: "Читалище 'Просвета'",
    settlementId: "Пловдив",
    createdBy: "test-user-2",
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000
  },
  {
    title: "Фестивал на изкуствата",
    desc: "Местен фестивал с изложби, концерти и работилници за деца и възрастни",
    when: Date.now() + 2592000000, // 30 days from now
    where: "Градски площад",
    settlementId: "Варна",
    createdBy: "test-user-3",
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000
  }
];

async function seedData() {
  try {
    console.log("Adding test signals...");
    for (const signal of testSignals) {
      await addDoc(collection(db, "signals"), signal);
    }

    console.log("Adding test ideas...");
    for (const idea of testIdeas) {
      await addDoc(collection(db, "ideas"), idea);
    }

    console.log("Adding test events...");
    for (const event of testEvents) {
      await addDoc(collection(db, "events"), event);
    }

    console.log("✅ Test data added successfully!");
  } catch (error) {
    console.error("❌ Error adding test data:", error);
  }
}

// Run the seeding
seedData();
