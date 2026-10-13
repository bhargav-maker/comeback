import { dbGetAll, dbPut, dbClear } from './db.js';

/* ================================================================
   STUDYFLOW - MASTER BLUEPRINT  |  140 ITEMS  |  LOCKED 10/10
   Oct 19, 2026 -> Jan 7, 2027  |  70 study days  |  Sundays skipped
   Edit blueprintPayload below, then bump SEED_VERSION to reseed.
   ================================================================ */
export const SEED_VERSION = '4';
export const TOTAL = 140;

const blueprintPayload = [
  { id: "day01-A", dayNumber: 1,  date: "2026-10-19", slot: "A", subject: "Math",          title: "Ch 1: Orienting Yourself",          status: "pending" },
  { id: "day01-B", dayNumber: 1,  date: "2026-10-19", slot: "B", subject: "IT",            title: "Unit 1: Communication",             status: "pending" },
  { id: "day02-A", dayNumber: 2,  date: "2026-10-20", slot: "A", subject: "Science",       title: "Ch 1: Secondary Science",           status: "pending" },
  { id: "day02-B", dayNumber: 2,  date: "2026-10-20", slot: "B", subject: "Kaushal Vikas", title: "Ch 1: Agriculture",                 status: "pending" },
  { id: "day03-A", dayNumber: 3,  date: "2026-10-21", slot: "A", subject: "Social Science",title: "Ch 1: Understanding SST",           status: "pending" },
  { id: "day03-B", dayNumber: 3,  date: "2026-10-21", slot: "B", subject: "English Lit",   title: "Ch 1: Grandmother",                 status: "pending" },
  { id: "day04-A", dayNumber: 4,  date: "2026-10-22", slot: "A", subject: "Math",          title: "Ch 2: Linear Polynomials",          status: "pending" },
  { id: "day04-B", dayNumber: 4,  date: "2026-10-22", slot: "B", subject: "English Gram",  title: "Item 1: Determiners",               status: "pending" },
  { id: "day05-A", dayNumber: 5,  date: "2026-10-23", slot: "A", subject: "Science",       title: "Ch 2: Cell",                        status: "pending" },
  { id: "day05-B", dayNumber: 5,  date: "2026-10-23", slot: "B", subject: "Hindi Lit",     title: "Ch 1: दो बैलों की कथा",              status: "pending" },
  { id: "day06-A", dayNumber: 6,  date: "2026-10-24", slot: "A", subject: "Social Science",title: "Ch 2: Shaping Earth",               status: "pending" },
  { id: "day06-B", dayNumber: 6,  date: "2026-10-24", slot: "B", subject: "Hindi Gram",    title: "Topic 1",                           status: "pending" },
  { id: "day07-A", dayNumber: 7,  date: "2026-10-26", slot: "A", subject: "Math",          title: "Ch 3: World of Numbers",            status: "pending" },
  { id: "day07-B", dayNumber: 7,  date: "2026-10-26", slot: "B", subject: "Marathi Lit",   title: "Ch 1: बेटा मी ऐकतो आहे",             status: "pending" },
  { id: "day08-A", dayNumber: 8,  date: "2026-10-27", slot: "A", subject: "Science",       title: "Ch 3: Tissues",                     status: "pending" },
  { id: "day08-B", dayNumber: 8,  date: "2026-10-27", slot: "B", subject: "Marathi Gram",  title: "Topic 1",                           status: "pending" },
  { id: "day09-A", dayNumber: 9,  date: "2026-10-28", slot: "A", subject: "Social Science",title: "Ch 3: Atmosphere",                  status: "pending" },
  { id: "day09-B", dayNumber: 9,  date: "2026-10-28", slot: "B", subject: "IT",            title: "Unit 2: Self-Management",           status: "pending" },
  { id: "day10-A", dayNumber: 10, date: "2026-10-29", slot: "A", subject: "Math",          title: "Ch 4: Algebraic Identities",        status: "pending" },
  { id: "day10-B", dayNumber: 10, date: "2026-10-29", slot: "B", subject: "Kaushal Vikas", title: "Ch 2: Rooftop Gardening",           status: "pending" },
  { id: "day11-A", dayNumber: 11, date: "2026-10-30", slot: "A", subject: "Science",       title: "Ch 4: Motion",                      status: "pending" },
  { id: "day11-B", dayNumber: 11, date: "2026-10-30", slot: "B", subject: "English Lit",   title: "Ch 2: Bharat Our Land",             status: "pending" },
  { id: "day12-A", dayNumber: 12, date: "2026-10-31", slot: "A", subject: "Social Science",title: "Ch 4: Early Humans",                status: "pending" },
  { id: "day12-B", dayNumber: 12, date: "2026-10-31", slot: "B", subject: "English Gram",  title: "Item 2: Tenses",                    status: "pending" },
  { id: "day13-A", dayNumber: 13, date: "2026-11-02", slot: "A", subject: "Math",          title: "Ch 5: Up and Down",                 status: "pending" },
  { id: "day13-B", dayNumber: 13, date: "2026-11-02", slot: "B", subject: "Hindi Lit",     title: "Ch 2: क्या लिखूँ?",                  status: "pending" },
  { id: "day14-A", dayNumber: 14, date: "2026-11-03", slot: "A", subject: "Science",       title: "Ch 5: Mixtures",                    status: "pending" },
  { id: "day14-B", dayNumber: 14, date: "2026-11-03", slot: "B", subject: "Hindi Gram",    title: "Topic 2",                           status: "pending" },
  { id: "day15-A", dayNumber: 15, date: "2026-11-04", slot: "A", subject: "Social Science",title: "Ch 5: State & Society",             status: "pending" },
  { id: "day15-B", dayNumber: 15, date: "2026-11-04", slot: "B", subject: "Marathi Lit",   title: "Ch 2: जी. आय. पी. रेल्वे",            status: "pending" },
  { id: "day16-A", dayNumber: 16, date: "2026-11-05", slot: "A", subject: "Math",          title: "Ch 6: Perimeter and Area",          status: "pending" },
  { id: "day16-B", dayNumber: 16, date: "2026-11-05", slot: "B", subject: "Marathi Gram",  title: "Topic 2",                           status: "pending" },
  { id: "day17-A", dayNumber: 17, date: "2026-11-06", slot: "A", subject: "Science",       title: "Ch 6: Forces",                      status: "pending" },
  { id: "day17-B", dayNumber: 17, date: "2026-11-06", slot: "B", subject: "IT",            title: "Unit 3: ICT Skills",                status: "pending" },
  { id: "day18-A", dayNumber: 18, date: "2026-11-07", slot: "A", subject: "Social Science",title: "Ch 6: Democracy",                   status: "pending" },
  { id: "day18-B", dayNumber: 18, date: "2026-11-07", slot: "B", subject: "Kaushal Vikas", title: "Ch 3: Precision Farming",           status: "pending" },
  { id: "day19-A", dayNumber: 19, date: "2026-11-09", slot: "A", subject: "Math",          title: "Ch 7: Maybe (Probability)",         status: "pending" },
  { id: "day19-B", dayNumber: 19, date: "2026-11-09", slot: "B", subject: "English Lit",   title: "Ch 3: The Pot Maker",               status: "pending" },
  { id: "day20-A", dayNumber: 20, date: "2026-11-10", slot: "A", subject: "Science",       title: "Ch 7: Work & Energy",               status: "pending" },
  { id: "day20-B", dayNumber: 20, date: "2026-11-10", slot: "B", subject: "English Gram",  title: "Item 3: Modals",                    status: "pending" },
  { id: "day21-A", dayNumber: 21, date: "2026-11-11", slot: "A", subject: "Social Science",title: "Ch 7: Elections",                   status: "pending" },
  { id: "day21-B", dayNumber: 21, date: "2026-11-11", slot: "B", subject: "Hindi Lit",     title: "Ch 3: संवादहीन",                    status: "pending" },
  { id: "day22-A", dayNumber: 22, date: "2026-11-12", slot: "A", subject: "Math",          title: "Ch 8: Predicting Next",             status: "pending" },
  { id: "day22-B", dayNumber: 22, date: "2026-11-12", slot: "B", subject: "Hindi Gram",    title: "Topic 3",                           status: "pending" },
  { id: "day23-A", dayNumber: 23, date: "2026-11-13", slot: "A", subject: "Science",       title: "Ch 8: Inside Atom",                 status: "pending" },
  { id: "day23-B", dayNumber: 23, date: "2026-11-13", slot: "B", subject: "Marathi Lit",   title: "Ch 3: ऑलिंपिक वर्तुळाचा गोफ",          status: "pending" },
  { id: "day24-A", dayNumber: 24, date: "2026-11-14", slot: "A", subject: "Social Science",title: "Ch 8: Economics Blocks",            status: "pending" },
  { id: "day24-B", dayNumber: 24, date: "2026-11-14", slot: "B", subject: "Marathi Gram",  title: "Topic 3",                           status: "pending" },
  { id: "day25-A", dayNumber: 25, date: "2026-11-16", slot: "A", subject: "Math",          title: "Ch 9: Propositions",                status: "pending" },
  { id: "day25-B", dayNumber: 25, date: "2026-11-16", slot: "B", subject: "IT",            title: "Unit 4: Entrepreneurial Skills",    status: "pending" },
  { id: "day26-A", dayNumber: 26, date: "2026-11-17", slot: "A", subject: "Science",       title: "Ch 9: Atomic Foundations",          status: "pending" },
  { id: "day26-B", dayNumber: 26, date: "2026-11-17", slot: "B", subject: "Kaushal Vikas", title: "Ch 5: Shaping Materials",           status: "pending" },
  { id: "day27-A", dayNumber: 27, date: "2026-11-18", slot: "A", subject: "Social Science",title: "Ch 9: The Price Puzzle",            status: "pending" },
  { id: "day27-B", dayNumber: 27, date: "2026-11-18", slot: "B", subject: "English Lit",   title: "Ch 4: Gifts of Grace",              status: "pending" },
  { id: "day28-A", dayNumber: 28, date: "2026-11-19", slot: "A", subject: "Math",          title: "Ch 10: Quantities Combine",         status: "pending" },
  { id: "day28-B", dayNumber: 28, date: "2026-11-19", slot: "B", subject: "English Gram",  title: "Item 4: Reported Speech",           status: "pending" },
  { id: "day29-A", dayNumber: 29, date: "2026-11-20", slot: "A", subject: "Science",       title: "Ch 10: Sound Waves",                status: "pending" },
  { id: "day29-B", dayNumber: 29, date: "2026-11-20", slot: "B", subject: "Hindi Lit",     title: "Ch 4: ऐसी भी बातें होती हैं",           status: "pending" },
  { id: "day30-A", dayNumber: 30, date: "2026-11-21", slot: "A", subject: "Social Science",title: "Ch 10: Oceans and Life",            status: "pending" },
  { id: "day30-B", dayNumber: 30, date: "2026-11-21", slot: "B", subject: "Hindi Gram",    title: "Topic 4",                           status: "pending" },
  { id: "day31-A", dayNumber: 31, date: "2026-11-23", slot: "A", subject: "Math",          title: "Ch 11: Algorithms",                 status: "pending" },
  { id: "day31-B", dayNumber: 31, date: "2026-11-23", slot: "B", subject: "Marathi Lit",   title: "Ch 4: दिव्याच्या शोधामागचे दिव्य",     status: "pending" },
  { id: "day32-A", dayNumber: 32, date: "2026-11-24", slot: "A", subject: "Science",       title: "Ch 11: Reproduction",               status: "pending" },
  { id: "day32-B", dayNumber: 32, date: "2026-11-24", slot: "B", subject: "Marathi Gram",  title: "Topic 4",                           status: "pending" },
  { id: "day33-A", dayNumber: 33, date: "2026-11-25", slot: "A", subject: "Social Science",title: "Ch 11: Life on Earth",              status: "pending" },
  { id: "day33-B", dayNumber: 33, date: "2026-11-25", slot: "B", subject: "IT",            title: "Unit 5: Green Skills",              status: "pending" },
  { id: "day34-A", dayNumber: 34, date: "2026-11-26", slot: "A", subject: "Math",          title: "Ch 12: Quadrilaterals",             status: "pending" },
  { id: "day34-B", dayNumber: 34, date: "2026-11-26", slot: "B", subject: "Kaushal Vikas", title: "Ch 6: Construction",                status: "pending" },
  { id: "day35-A", dayNumber: 35, date: "2026-11-27", slot: "A", subject: "Science",       title: "Ch 12: Patterns in Life",           status: "pending" },
  { id: "day35-B", dayNumber: 35, date: "2026-11-27", slot: "B", subject: "English Lit",   title: "Ch 5: Winds of Change",             status: "pending" },
  { id: "day36-A", dayNumber: 36, date: "2026-11-28", slot: "A", subject: "Social Science",title: "Ch 12: Resistance",                 status: "pending" },
  { id: "day36-B", dayNumber: 36, date: "2026-11-28", slot: "B", subject: "English Gram",  title: "Item 5: Conditionals",              status: "pending" },
  { id: "day37-A", dayNumber: 37, date: "2026-11-30", slot: "A", subject: "Math",          title: "Ch 13: Two Variables",              status: "pending" },
  { id: "day37-B", dayNumber: 37, date: "2026-11-30", slot: "B", subject: "Hindi Lit",     title: "Ch 5: आखिरी चट्टान तक",              status: "pending" },
  { id: "day38-A", dayNumber: 38, date: "2026-12-01", slot: "A", subject: "Science",       title: "Ch 13: Earth System",               status: "pending" },
  { id: "day38-B", dayNumber: 38, date: "2026-12-01", slot: "B", subject: "Hindi Gram",    title: "Topic 5",                           status: "pending" },
  { id: "day39-A", dayNumber: 39, date: "2026-12-02", slot: "A", subject: "Social Science",title: "Ch 13: India & World",              status: "pending" },
  { id: "day39-B", dayNumber: 39, date: "2026-12-02", slot: "B", subject: "Marathi Lit",   title: "Ch 5: संतवाणी",                     status: "pending" },
  { id: "day40-A", dayNumber: 40, date: "2026-12-03", slot: "A", subject: "Math",          title: "Ch 14: Surface Area",               status: "pending" },
  { id: "day40-B", dayNumber: 40, date: "2026-12-03", slot: "B", subject: "Marathi Gram",  title: "Topic 5",                           status: "pending" },
  { id: "day41-A", dayNumber: 41, date: "2026-12-04", slot: "A", subject: "Social Science",title: "Ch 14: Authority",                  status: "pending" },
  { id: "day41-B", dayNumber: 41, date: "2026-12-04", slot: "B", subject: "IT",            title: "Unit 6: Intro to IT-ITeS",          status: "pending" },
  { id: "day42-A", dayNumber: 42, date: "2026-12-05", slot: "A", subject: "Social Science",title: "Ch 15: Ideas to Startups",          status: "pending" },
  { id: "day42-B", dayNumber: 42, date: "2026-12-05", slot: "B", subject: "Kaushal Vikas", title: "Ch 7: Apparel",                     status: "pending" },
  { id: "day43-A", dayNumber: 43, date: "2026-12-07", slot: "A", subject: "Social Science",title: "Ch 16: Finances",                   status: "pending" },
  { id: "day43-B", dayNumber: 43, date: "2026-12-07", slot: "B", subject: "English Lit",   title: "Ch 6: Canvas of Soil",              status: "pending" },
  { id: "day44-A", dayNumber: 44, date: "2026-12-08", slot: "A", subject: "English Lit",   title: "Ch 7: Vitamin-M",                   status: "pending" },
  { id: "day44-B", dayNumber: 44, date: "2026-12-08", slot: "B", subject: "English Gram",  title: "Item 6: Subject-Verb",              status: "pending" },
  { id: "day45-A", dayNumber: 45, date: "2026-12-09", slot: "A", subject: "Hindi Lit",     title: "Ch 6: रीढ़ की हड्डी",                status: "pending" },
  { id: "day45-B", dayNumber: 45, date: "2026-12-09", slot: "B", subject: "Hindi Gram",    title: "Topic 6",                           status: "pending" },
  { id: "day46-A", dayNumber: 46, date: "2026-12-10", slot: "A", subject: "Marathi Lit",   title: "Ch 6: व्यायामाचे महत्त्व",            status: "pending" },
  { id: "day46-B", dayNumber: 46, date: "2026-12-10", slot: "B", subject: "Marathi Gram",  title: "Topic 6",                           status: "pending" },
  { id: "day47-A", dayNumber: 47, date: "2026-12-11", slot: "A", subject: "IT",            title: "Unit 7: Data Entry",                status: "pending" },
  { id: "day47-B", dayNumber: 47, date: "2026-12-11", slot: "B", subject: "Kaushal Vikas", title: "Ch 9: Personal Services",           status: "pending" },
  { id: "day48-A", dayNumber: 48, date: "2026-12-12", slot: "A", subject: "English Lit",   title: "Ch 8: Remember Mother",             status: "pending" },
  { id: "day48-B", dayNumber: 48, date: "2026-12-12", slot: "B", subject: "English Writing",title: "Item 7: Descriptive",              status: "pending" },
  { id: "day49-A", dayNumber: 49, date: "2026-12-14", slot: "A", subject: "Hindi Lit",     title: "Ch 7: मैं और मेरा देश",              status: "pending" },
  { id: "day49-B", dayNumber: 49, date: "2026-12-14", slot: "B", subject: "Hindi Gram",    title: "Topic 7",                           status: "pending" },
  { id: "day50-A", dayNumber: 50, date: "2026-12-15", slot: "A", subject: "Marathi Lit",   title: "Ch 7",                              status: "pending" },
  { id: "day50-B", dayNumber: 50, date: "2026-12-15", slot: "B", subject: "IT",            title: "Unit 8: Digital Documentation",     status: "pending" },
  { id: "day51-A", dayNumber: 51, date: "2026-12-16", slot: "A", subject: "Kaushal Vikas", title: "Ch 10: Healthcare",                 status: "pending" },
  { id: "day51-B", dayNumber: 51, date: "2026-12-16", slot: "B", subject: "English Lit",   title: "Ch 9: Limitless Possibilities",     status: "pending" },
  { id: "day52-A", dayNumber: 52, date: "2026-12-17", slot: "A", subject: "English Writing",title: "Item 8: Notice",                   status: "pending" },
  { id: "day52-B", dayNumber: 52, date: "2026-12-17", slot: "B", subject: "Hindi Lit",     title: "Ch 8: पद",                          status: "pending" },
  { id: "day53-A", dayNumber: 53, date: "2026-12-18", slot: "A", subject: "Hindi Gram",    title: "Topic 8",                           status: "pending" },
  { id: "day53-B", dayNumber: 53, date: "2026-12-18", slot: "B", subject: "Marathi Lit",   title: "Ch 8",                              status: "pending" },
  { id: "day54-A", dayNumber: 54, date: "2026-12-19", slot: "A", subject: "IT",            title: "Unit 9: Spreadsheet",               status: "pending" },
  { id: "day54-B", dayNumber: 54, date: "2026-12-19", slot: "B", subject: "Kaushal Vikas", title: "Ch 11: Tourism",                    status: "pending" },
  { id: "day55-A", dayNumber: 55, date: "2026-12-21", slot: "A", subject: "English Lit",   title: "Ch 10: Nine Gold Medals",           status: "pending" },
  { id: "day55-B", dayNumber: 55, date: "2026-12-21", slot: "B", subject: "English Writing",title: "Item 9: Letter",                   status: "pending" },
  { id: "day56-A", dayNumber: 56, date: "2026-12-22", slot: "A", subject: "Hindi Lit",     title: "Ch 9: राम-लक्ष्मण",                 status: "pending" },
  { id: "day56-B", dayNumber: 56, date: "2026-12-22", slot: "B", subject: "Hindi Gram",    title: "Topic 9",                           status: "pending" },
  { id: "day57-A", dayNumber: 57, date: "2026-12-23", slot: "A", subject: "Marathi Lit",   title: "Ch 9",                              status: "pending" },
  { id: "day57-B", dayNumber: 57, date: "2026-12-23", slot: "B", subject: "IT",            title: "Unit 10: Presentation",             status: "pending" },
  { id: "day58-A", dayNumber: 58, date: "2026-12-24", slot: "A", subject: "English Lit",   title: "Ch 11: Twin Melodies",              status: "pending" },
  { id: "day58-B", dayNumber: 58, date: "2026-12-24", slot: "B", subject: "English Writing",title: "Item 10: Factual Description",     status: "pending" },
  { id: "day59-A", dayNumber: 59, date: "2026-12-25", slot: "A", subject: "Hindi Lit",     title: "Ch 10: भारति",                      status: "pending" },
  { id: "day59-B", dayNumber: 59, date: "2026-12-25", slot: "B", subject: "Hindi Gram",    title: "Topic 10",                          status: "pending" },
  { id: "day60-A", dayNumber: 60, date: "2026-12-26", slot: "A", subject: "Marathi Lit",   title: "Ch 10",                             status: "pending" },
  { id: "day60-B", dayNumber: 60, date: "2026-12-26", slot: "B", subject: "English Lit",   title: "Ch 12: Friend Found in Music",      status: "pending" },
  { id: "day61-A", dayNumber: 61, date: "2026-12-28", slot: "A", subject: "English Writing",title: "Item 11: Invitation",              status: "pending" },
  { id: "day61-B", dayNumber: 61, date: "2026-12-28", slot: "B", subject: "Hindi Lit",     title: "Ch 11: झाँसी की रानी",               status: "pending" },
  { id: "day62-A", dayNumber: 62, date: "2026-12-29", slot: "A", subject: "Hindi Gram",    title: "Topic 11",                          status: "pending" },
  { id: "day62-B", dayNumber: 62, date: "2026-12-29", slot: "B", subject: "Marathi Lit",   title: "Ch 11",                             status: "pending" },
  { id: "day63-A", dayNumber: 63, date: "2026-12-30", slot: "A", subject: "English Lit",   title: "Ch 13: Carrier of Words",           status: "pending" },
  { id: "day63-B", dayNumber: 63, date: "2026-12-30", slot: "B", subject: "English Writing",title: "Item 12: Narrative",               status: "pending" },
  { id: "day64-A", dayNumber: 64, date: "2026-12-31", slot: "A", subject: "Hindi Lit",     title: "Ch 12: घर की याद",                   status: "pending" },
  { id: "day64-B", dayNumber: 64, date: "2026-12-31", slot: "B", subject: "Hindi Gram",    title: "Topic 12",                          status: "pending" },
  { id: "day65-A", dayNumber: 65, date: "2027-01-01", slot: "A", subject: "Marathi Lit",   title: "Ch 12",                             status: "pending" },
  { id: "day65-B", dayNumber: 65, date: "2027-01-01", slot: "B", subject: "English Lit",   title: "Ch 14: Words",                      status: "pending" },
  { id: "day66-A", dayNumber: 66, date: "2027-01-02", slot: "A", subject: "English Writing",title: "Item 13: Formal Email",            status: "pending" },
  { id: "day66-B", dayNumber: 66, date: "2027-01-02", slot: "B", subject: "Hindi Gram",    title: "Topic 13",                          status: "pending" },
  { id: "day67-A", dayNumber: 67, date: "2027-01-04", slot: "A", subject: "Marathi Lit",   title: "Ch 13",                             status: "pending" },
  { id: "day67-B", dayNumber: 67, date: "2027-01-04", slot: "B", subject: "English Lit",   title: "Ch 15: Follow That Dream",          status: "pending" },
  { id: "day68-A", dayNumber: 68, date: "2027-01-05", slot: "A", subject: "English Writing",title: "Item 14: Magazine Article",        status: "pending" },
  { id: "day68-B", dayNumber: 68, date: "2027-01-05", slot: "B", subject: "Marathi Lit",   title: "Ch 14",                             status: "pending" },
  { id: "day69-A", dayNumber: 69, date: "2027-01-06", slot: "A", subject: "Hindi Gram",    title: "Topic 14",                          status: "pending" },
  { id: "day69-B", dayNumber: 69, date: "2027-01-06", slot: "B", subject: "Marathi Lit",   title: "Ch 15: Venice",                     status: "pending" },
  { id: "day70-A", dayNumber: 70, date: "2027-01-07", slot: "A", subject: "English Lit",   title: "Ch 16: Believe",                    status: "pending" },
  { id: "day70-B", dayNumber: 70, date: "2027-01-07", slot: "B", subject: "Marathi Lit",   title: "Ch 16",                             status: "pending" }
];

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export function studyDays() {
  const days = [];
  const d = new Date('2026-10-19T00:00:00');
  while (days.length < 70) {
    if (d.getDay() !== 0) days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export async function seedBlueprint() {
  if (localStorage.getItem('sf_seed_v') === SEED_VERSION) return;
  if (blueprintPayload.length !== TOTAL) console.error('Blueprint must contain 140 items, got', blueprintPayload.length);
  await dbClear('blueprint');
  for (const item of blueprintPayload) {
    await dbPut('blueprint', { ...item, isVaulted: false });
  }
  localStorage.setItem('sf_seed_v', SEED_VERSION);
}

/* pending + assigned date has passed -> vaulted (Sunday Vault source) */
export async function refreshVault(items) {
  const today = todayStr();
  for (const it of items) {
    const v = it.status !== 'done' && it.date < today;
    if (v !== it.isVaulted) { it.isVaulted = v; await dbPut('blueprint', it); }
  }
}
