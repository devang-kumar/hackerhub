require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Competition = require('./models/Competition');
const Course = require('./models/Course');
const Mentor = require('./models/Mentor');

async function seed() {
  await connectDB();
  console.log('🌱 Connected to DB. Seeding...');

  // ─── Clean previous seed data ───
  await User.deleteMany({ email: { $in: [
    'organizer@hackhub.dev',
    'mentor1@hackhub.dev', 'mentor2@hackhub.dev',
    'mentor3@hackhub.dev', 'mentor4@hackhub.dev',
    'mentor5@hackhub.dev',
  ]}});
  await Competition.deleteMany({ tags: 'seeded' });
  await Course.deleteMany({ banner: { $regex: '^/seed/' } });
  await Mentor.deleteMany({});  // clean all mentors so we recreate fresh ones

  // ─── Seed Organizer User ───
  const organizer = await User.create({
    name: 'HackHub Admin',
    email: 'organizer@hackhub.dev',
    password: 'Admin@123',
    role: 'organizer',
    isVerified: true,
    bio: 'Official HackHub competition organizer.',
    skills: ['Management', 'Event Planning'],
  });

  // ─── Seed Mentor Users ───
  const mentorUsers = await User.create([
    {
      name: 'Arjun Sharma',
      email: 'mentor1@hackhub.dev',
      password: 'Mentor@123',
      bio: 'Full-Stack Engineer at Google with 8 years of experience in React, Node.js and System Design.',
      skills: ['React', 'Node.js', 'System Design'],
      isVerified: true,
    },
    {
      name: 'Priya Menon',
      email: 'mentor2@hackhub.dev',
      password: 'Mentor@123',
      bio: 'Data Scientist at Amazon. Passionate about ML, Python and mentoring the next generation of AI engineers.',
      skills: ['Python', 'Machine Learning', 'TensorFlow'],
      isVerified: true,
    },
    {
      name: 'Rahul Joshi',
      email: 'mentor3@hackhub.dev',
      password: 'Mentor@123',
      bio: 'Cybersecurity expert with 10 years in ethical hacking and cloud security. CEH & OSCP certified.',
      skills: ['Cybersecurity', 'Ethical Hacking', 'AWS'],
      isVerified: true,
    },
    {
      name: 'Sneha Kapoor',
      email: 'mentor4@hackhub.dev',
      password: 'Mentor@123',
      bio: 'Android & Flutter developer. Former tech lead at Flipkart. Open source contributor.',
      skills: ['Flutter', 'Android', 'Dart'],
      isVerified: true,
    },
    {
      name: 'Vikram Nair',
      email: 'mentor5@hackhub.dev',
      password: 'Mentor@123',
      bio: 'Startup founder and product manager. Bootstrapped 2 SaaS products to $1M ARR.',
      skills: ['Product Management', 'Startups', 'UX'],
      isVerified: true,
    },
  ]);

  // ─── Seed Mentors ───
  const makeSlots = () => [
    { date: '2026-04-07', time: '10:00 AM', isBooked: false },
    { date: '2026-04-07', time: '02:00 PM', isBooked: false },
    { date: '2026-04-08', time: '11:00 AM', isBooked: false },
    { date: '2026-04-09', time: '04:00 PM', isBooked: false },
    { date: '2026-04-10', time: '09:00 AM', isBooked: false },
  ];

  await Mentor.create([
    {
      user: mentorUsers[0]._id,
      domain: 'Web Development',
      expertise: ['React', 'Node.js', 'MongoDB', 'System Design', 'TypeScript'],
      bio: 'Full-Stack Engineer at Google with 8 years building scalable web apps. I help students ace their SDE interviews and build production-grade projects.',
      pricePerHour: 799,
      rating: 4.9,
      sessionsCompleted: 142,
      availableSlots: makeSlots(),
    },
    {
      user: mentorUsers[1]._id,
      domain: 'Data Science & AI',
      expertise: ['Python', 'Machine Learning', 'TensorFlow', 'NLP', 'Data Analysis'],
      bio: 'Data Scientist at Amazon pushing the boundaries of ML. I mentor on end-to-end ML pipelines, Kaggle competitions and research papers.',
      pricePerHour: 999,
      rating: 4.8,
      sessionsCompleted: 98,
      availableSlots: makeSlots(),
    },
    {
      user: mentorUsers[2]._id,
      domain: 'Cybersecurity',
      expertise: ['Ethical Hacking', 'Penetration Testing', 'OSCP', 'AWS Security', 'CTF'],
      bio: 'Seasoned cybersecurity pro. CEH & OSCP certified. I run hands-on labs, CTF walkthroughs and career guidance for aspiring security engineers.',
      pricePerHour: 1199,
      rating: 4.7,
      sessionsCompleted: 63,
      availableSlots: makeSlots(),
    },
    {
      user: mentorUsers[3]._id,
      domain: 'Mobile Development',
      expertise: ['Flutter', 'Android', 'Dart', 'Firebase', 'Kotlin'],
      bio: 'Mobile-first developer and former Flipkart tech lead. I help developers publish polished cross-platform apps on the Play Store and App Store.',
      pricePerHour: 699,
      rating: 4.9,
      sessionsCompleted: 211,
      availableSlots: makeSlots(),
    },
    {
      user: mentorUsers[4]._id,
      domain: 'Product Management',
      expertise: ['Product Roadmap', 'Agile', 'User Research', 'OKRs', 'Startup Strategy'],
      bio: 'Bootstrapped founder who scaled two SaaS products. I mentor on career transitions into PM, product strategy and startup ideation.',
      pricePerHour: 1499,
      rating: 5.0,
      sessionsCompleted: 57,
      availableSlots: makeSlots(),
    },
  ]);
  console.log('✅ 5 Mentors seeded');

  // ─── Seed Competitions ───
  const now = new Date();
  const d = (days) => new Date(now.getTime() + days * 86400000);

  await Competition.create([
    {
      title: 'HackIndia 2026 – National Hackathon',
      description: 'HackIndia is India\'s largest student hackathon bringing together 5000+ innovators across 200+ colleges. Build solutions in AI/ML, FinTech, HealthTech, or EdTech and compete for ₹10 Lakh in prizes. 36-hour non-stop coding sprint with mentors from Google, Microsoft & Razorpay on standby.',
      type: 'hackathon',
      mode: 'hybrid',
      organizer: organizer._id,
      teamSize: { min: 2, max: 4 },
      registrationDeadline: d(15),
      startDate: d(20),
      endDate: d(22),
      eligibility: 'Open to all UG/PG students across India',
      prizes: [
        { position: '1st Place', amount: '₹5,00,000', description: 'Cash prize + pre-placement offer from sponsor' },
        { position: '2nd Place', amount: '₹2,00,000', description: 'Cash prize + internship opportunity' },
        { position: '3rd Place', amount: '₹1,00,000', description: 'Cash prize + goodies' },
      ],
      stages: [
        { title: 'Idea Submission', description: 'Submit your 1-page problem statement & solution idea', startDate: d(1), endDate: d(7) },
        { title: 'Prototype Round', description: 'Build an MVP and present it to mentors', startDate: d(15), endDate: d(18) },
        { title: 'Grand Finale', description: '36-hour hackathon at IIT Delhi campus', startDate: d(20), endDate: d(22) },
      ],
      tags: ['seeded', 'AI', 'FinTech', 'HealthTech', 'EdTech'],
      status: 'active',
    },
    {
      title: 'CodeBlitz – Competitive Programming Contest',
      description: 'CodeBlitz is a 3-hour algorithmic programming contest on our judge platform. Solve 8 problems ranging from easy greedy to hard dynamic programming. Qualifying round for ICPC Asia Regionals coaching program. Organized in partnership with Codeforces educators.',
      type: 'coding',
      mode: 'online',
      organizer: organizer._id,
      teamSize: { min: 1, max: 1 },
      registrationDeadline: d(5),
      startDate: d(7),
      endDate: d(7),
      eligibility: 'Open to all. Rating of 1200+ on Codeforces recommended.',
      prizes: [
        { position: '1st Place', amount: '₹25,000', description: 'Cash + Codeforces Pro subscription' },
        { position: '2nd Place', amount: '₹15,000', description: 'Cash prize' },
        { position: '3rd Place', amount: '₹10,000', description: 'Cash prize' },
      ],
      stages: [
        { title: 'Online Round', description: '3-hour contest with 8 algorithmic problems', startDate: d(7), endDate: d(7) },
      ],
      tags: ['seeded', 'DSA', 'Algorithms', 'ICPC'],
      status: 'active',
    },
    {
      title: 'GreenTech Case Challenge 2026',
      description: 'Tackle real-world sustainability problems presented by Tata Consultancy Services. Analyse business cases on climate tech, renewable energy and circular economy. Present your solution deck to a panel of industry judges. Top teams will be fast-tracked to TCS recruitment pipeline.',
      type: 'case-study',
      mode: 'online',
      organizer: organizer._id,
      teamSize: { min: 2, max: 3 },
      registrationDeadline: d(10),
      startDate: d(14),
      endDate: d(16),
      eligibility: 'MBA, BBA and Engineering final-year students',
      prizes: [
        { position: 'Winner', amount: '₹75,000', description: 'Cash + TCS pre-placement interview' },
        { position: 'Runner Up', amount: '₹40,000', description: 'Cash prize' },
      ],
      stages: [
        { title: 'Case Release', description: 'Problem statement released; teams analyse and prepare solution', startDate: d(14), endDate: d(15) },
        { title: 'Presentation Day', description: 'Final pitch to TCS judges via video call', startDate: d(16), endDate: d(16) },
      ],
      tags: ['seeded', 'Sustainability', 'TCS', 'Business'],
      status: 'active',
    },
    {
      title: 'UI/UX Design Sprint – Figma Challenge',
      description: 'Design the future of digital India in this 48-hour design sprint. Create high-fidelity wireframes and prototypes for a chosen problem domain (GovTech, AgriTech or HealthTech). Winning designs may be adopted by partner NGOs. Judged by designers from Swiggy, Zomato and CRED.',
      type: 'other',
      mode: 'online',
      organizer: organizer._id,
      teamSize: { min: 1, max: 2 },
      registrationDeadline: d(8),
      startDate: d(10),
      endDate: d(12),
      eligibility: 'Open to all designers and developers',
      prizes: [
        { position: '1st Place', amount: '₹30,000', description: 'Cash + Figma Pro + mentorship from Swiggy design team' },
        { position: '2nd Place', amount: '₹15,000', description: 'Cash prize' },
      ],
      stages: [
        { title: 'Design Sprint', description: '48-hour design marathon', startDate: d(10), endDate: d(12) },
      ],
      tags: ['seeded', 'UI/UX', 'Figma', 'Design'],
      status: 'active',
    },
    {
      title: 'FinQuiz – Finance & Markets Quiz',
      description: 'Test your financial acumen in this fast-paced quiz covering stock markets, derivatives, mutual funds, macro-economics and current affairs. Three rounds — MCQ blitz, rapid-fire and buzzer — make this India\'s most exciting finance quiz. Hosted by IIM Ahmedabad Finance Club.',
      type: 'quiz',
      mode: 'online',
      organizer: organizer._id,
      teamSize: { min: 1, max: 2 },
      registrationDeadline: d(3),
      startDate: d(5),
      endDate: d(5),
      eligibility: 'Open to all college students',
      prizes: [
        { position: '1st Place', amount: '₹20,000', description: 'Cash + Zerodha trading account credit' },
        { position: '2nd Place', amount: '₹10,000', description: 'Cash prize' },
      ],
      stages: [
        { title: 'Quiz Event', description: 'Live online quiz with 3 rounds', startDate: d(5), endDate: d(5) },
      ],
      tags: ['seeded', 'Finance', 'IIM', 'Quiz'],
      status: 'active',
    },
    {
      title: 'AI for Good – Social Impact Hackathon',
      description: 'Build AI-powered solutions to real problems faced by NGOs and rural communities in India. Partner NGOs will present problem statements live. Winning teams receive a ₹2 lakh grant to actually implement their solution. Supported by Google.org and United Nations India.',
      type: 'hackathon',
      mode: 'hybrid',
      organizer: organizer._id,
      teamSize: { min: 2, max: 5 },
      registrationDeadline: d(20),
      startDate: d(25),
      endDate: d(27),
      eligibility: 'Open to all. Multi-disciplinary teams encouraged.',
      prizes: [
        { position: 'Grand Prize', amount: '₹2,00,000 Grant', description: 'Implementation grant + Google Cloud credits' },
        { position: '2nd Place', amount: '₹75,000', description: 'Cash prize + mentorship' },
        { position: '3rd Place', amount: '₹50,000', description: 'Cash prize' },
      ],
      stages: [
        { title: 'Problem Statement Release', description: 'NGO partners reveal problem statements', startDate: d(20), endDate: d(21) },
        { title: 'Hacking Phase', description: '48-hour build sprint', startDate: d(25), endDate: d(27) },
      ],
      tags: ['seeded', 'AI', 'Social Impact', 'Google', 'United Nations'],
      status: 'active',
    },
  ]);
  console.log('✅ 6 Competitions seeded');

  // ─── Seed Courses (Projects / Learning) ───
  await Course.create([
    {
      title: 'Build a Full-Stack E-Commerce App with MERN',
      description: 'A project-based course where you build a production-ready e-commerce platform (like Amazon) using MongoDB, Express, React and Node.js. Includes authentication, Razorpay payments, admin dashboard, and deployment on AWS.',
      instructor: mentorUsers[0]._id,
      duration: '12 hours',
      level: 'Intermediate',
      price: 1299,
      banner: '/seed/mern-ecommerce.png',
      modules: [
        { title: 'Project Setup & Architecture', content: 'Setting up monorepo, environment variables and project structure.' },
        { title: 'Backend: REST API with Express & MongoDB', content: 'Building product, user, auth and order APIs.' },
        { title: 'Frontend: React + Redux Toolkit', content: 'Cart, product listing and checkout flows.' },
        { title: 'Payments with Razorpay', content: 'Integrating Razorpay SDK, webhooks and order confirmation.' },
        { title: 'Admin Dashboard', content: 'Managing products, orders and users with role-based access.' },
        { title: 'Deployment on AWS EC2 + S3', content: 'Deploying the full-stack app with NGINX and PM2.' },
      ],
    },
    {
      title: 'Machine Learning A–Z: Build 10 Real Projects',
      description: 'Go from zero to ML hero by building 10 capstone projects — spam classifier, house price prediction, face recognition, sentiment analyser, recommendation engine and more — using Python, scikit-learn, TensorFlow and Keras.',
      instructor: mentorUsers[1]._id,
      duration: '18 hours',
      level: 'Intermediate',
      price: 1499,
      banner: '/seed/ml-projects.png',
      modules: [
        { title: 'Python for Data Science', content: 'NumPy, Pandas, Matplotlib and Seaborn refresher.' },
        { title: 'Supervised Learning Projects', content: 'Linear Regression, Logistic Regression, SVM projects.' },
        { title: 'Unsupervised Learning', content: 'K-Means clustering, PCA and anomaly detection.' },
        { title: 'Neural Networks with TensorFlow', content: 'Building and training deep neural networks.' },
        { title: 'NLP: Sentiment Analysis & Text Classification', content: 'BERT fine-tuning and Hugging Face Transformers.' },
        { title: 'Deploying ML Models as APIs', content: 'FastAPI + Docker + Hugging Face Spaces.' },
      ],
    },
    {
      title: 'Ethical Hacking & Penetration Testing Bootcamp',
      description: 'Master ethical hacking with hands-on labs in a safe virtual environment. Cover network scanning, web app exploits (OWASP Top 10), privilege escalation, and report writing. Prepares you for CEH and OSCP certifications.',
      instructor: mentorUsers[2]._id,
      duration: '15 hours',
      level: 'Advanced',
      price: 1999,
      banner: '/seed/cybersec.png',
      modules: [
        { title: 'Kali Linux & Lab Setup', content: 'Setting up VirtualBox, Kali Linux and vulnerable VMs.' },
        { title: 'Reconnaissance & Scanning', content: 'Nmap, Shodan, OSINT techniques.' },
        { title: 'Web App Exploitation (OWASP Top 10)', content: 'SQL Injection, XSS, CSRF, IDOR walkthrough.' },
        { title: 'Network Attacks', content: 'ARP spoofing, man-in-the-middle, password cracking.' },
        { title: 'Privilege Escalation', content: 'Linux and Windows privilege escalation techniques.' },
        { title: 'CTF Walkthroughs & Report Writing', content: 'Solving 5 real CTF challenges and writing professional pentest reports.' },
      ],
    },
    {
      title: 'Flutter Masterclass – Build 5 Cross-Platform Apps',
      description: 'Learn Flutter from scratch and ship real apps for iOS and Android. Build a notes app, expense tracker, chat app with Firebase, food delivery UI clone, and a news reader app. Covers state management with Riverpod and CI/CD with GitHub Actions.',
      instructor: mentorUsers[3]._id,
      duration: '14 hours',
      level: 'Beginner',
      price: 999,
      banner: '/seed/flutter.png',
      modules: [
        { title: 'Dart Language Fundamentals', content: 'Variables, functions, OOP, async/await in Dart.' },
        { title: 'Flutter Widgets Deep Dive', content: 'Stateless vs Stateful, layout widgets, custom painters.' },
        { title: 'State Management with Riverpod', content: 'Providers, state notifiers and dependency injection.' },
        { title: 'Firebase Integration', content: 'Auth, Firestore, Cloud Storage and push notifications.' },
        { title: 'App 4: Food Delivery UI Clone', content: 'Pixel-perfect Swiggy-like UI with animations.' },
        { title: 'Publishing & CI/CD', content: 'Play Store submission + GitHub Actions for automated builds.' },
      ],
    },
    {
      title: 'Product Management Crash Course: Zero to PM',
      description: 'Break into Product Management with this fast-track course. Learn user research, product discovery, writing PRDs, running sprints, defining OKRs and acing PM interviews. Built by a founder who took two products from zero to $1M ARR.',
      instructor: mentorUsers[4]._id,
      duration: '8 hours',
      level: 'Beginner',
      price: 799,
      banner: '/seed/product-mgmt.png',
      modules: [
        { title: 'What Does a PM Actually Do?', content: 'Day-in-the-life, PM vs PO vs APM roles.' },
        { title: 'User Research & Discovery', content: 'Interviews, surveys, empathy maps and Jobs-to-be-Done.' },
        { title: 'Writing PRDs That Engineers Love', content: 'User stories, acceptance criteria and wireframes.' },
        { title: 'Agile & Sprint Planning', content: 'Scrum ceremonies, backlog grooming and velocity.' },
        { title: 'Metrics & OKRs', content: 'Defining north-star metrics, setting OKRs and dashboards.' },
        { title: 'PM Interview Prep', content: 'Product design, estimation and strategy questions with sample answers.' },
      ],
    },
  ]);
  console.log('✅ 5 Courses/Projects seeded');

  console.log('\n🎉 All data seeded successfully!');
  console.log('   Organizer login → organizer@hackhub.dev / Admin@123');
  console.log('   Mentor logins  → mentor1@hackhub.dev … mentor5@hackhub.dev / Mentor@123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
