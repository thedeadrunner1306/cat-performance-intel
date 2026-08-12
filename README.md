# Mission CAT 🎯

### CAT Mock Tracking & Performance Analytics Platform

**Mission CAT** is a web-based platform designed to help CAT aspirants track their mock-test performance, understand their strengths and weaknesses, and monitor preparation progress over time.

🔗 **Live Demo:** https://cat-performance-intel.vercel.app/

---

## 🚀 Why Mission CAT?

CAT preparation involves taking dozens of mocks, but simply knowing your score isn't enough.

Mission CAT helps aspirants answer questions like:

* Am I actually improving?
* Which section is consistently holding me back?
* Where am I losing marks?
* How is my performance changing across mocks?
* Which areas should I focus on next?

Instead of keeping mock scores scattered across spreadsheets or notebooks, Mission CAT brings them together into one personalized dashboard.

---

## ✨ Features

### 📊 Mock Performance Tracking

Record your mock-test performance and maintain a centralized history of your attempts.

### 📈 Performance Analytics

Visualize performance trends across:

* Overall score
* VARC
* DILR
* Quant

### 🎯 Strength & Weakness Analysis

Identify areas where performance is improving and topics that need more attention.

### 👤 Personal Accounts

Users can create individual accounts and maintain their own preparation data.

### ☁️ Cloud Database

Performance data is securely stored and synchronized using Supabase.

### 📱 Responsive Interface

Designed to work across desktop and mobile devices.

---

## 🛠️ Tech Stack

| Technology       | Purpose                          |
| ---------------- | -------------------------------- |
| **Next.js**      | Frontend & application framework |
| **React**        | UI development                   |
| **TypeScript**   | Type-safe development            |
| **Tailwind CSS** | Styling & responsive UI          |
| **Supabase**     | Authentication & database        |
| **PostgreSQL**   | Data storage                     |
| **Vercel**       | Deployment & hosting             |

---

## 🏗️ Architecture

```text
User
  │
  ▼
Mission CAT
(Next.js + React)
  │
  ├──────────────► Supabase Auth
  │
  └──────────────► Supabase PostgreSQL
                         │
                         ▼
                  Mock Performance
                       Data
```

---

## 🌐 Live Product

Mission CAT is publicly deployed and currently being tested by CAT aspirants.

**Live:**
https://cat-performance-intel.vercel.app/

The project is actively being improved based on user feedback and real-world usage.

---

## 📌 Current Status

🟢 **Live & actively being tested**

The first version has been released publicly to CAT aspirants to gather feedback, identify usability issues, and iterate on the product.

Future improvements may include:

* More detailed performance analytics
* Better topic-level insights
* Additional visualization options
* Improved mock comparison
* User feedback-driven features

---

## 💡 Product Thinking

Mission CAT was built around a simple principle:

> **Don't just track your CAT score. Understand your preparation.**

The goal is to turn raw mock-test data into actionable insights that help aspirants make better preparation decisions.

---

## 👨‍💻 About the Project

Mission CAT was independently designed, developed, deployed, and iterated as a real-world product project.

The project focuses not only on development but also on **product thinking, user feedback, analytics, and continuous iteration**.

---

## 📄 License

This project is currently intended for educational and personal use.
