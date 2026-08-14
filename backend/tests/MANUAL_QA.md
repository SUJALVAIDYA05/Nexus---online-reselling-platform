# Manual QA Checklist — Nexus Online Reselling Platform

## Overview
This document contains the structured Manual QA checklist for validating the Nexus platform before and after deployment.

---

## 1. End-to-End Core User Journey

- [x] **Step 1: Seller Account Registration**
  - Navigate to `/signup`.
  - Create a new user with role **Seller** (e.g. `seller_qa@nexus.com`).
  - Verify redirect to login/dashboard and check JWT cookie/token assignment.

- [x] **Step 2: Login**
  - Log out and log back in at `/login` with `seller_qa@nexus.com`.
  - Verify successful authentication and user state in navbar.

- [x] **Step 3: Post a Listing with Images**
  - Navigate to `/create-listing`.
  - Fill out title, description, category, condition, price, location, and upload listing images.
  - Submit listing and verify receipt of status `201`.

- [x] **Step 4: Browse & Search Verification**
  - Go to `/browse` (or browse page).
  - Confirm the new listing appears under active listings and within its category filter.
  - Use the search bar to search for the exact title/keywords — verify ranking and search results.

- [x] **Step 5: Buyer Favoriting & Messaging**
  - Open an incognito browser window (or separate browser session) and register/login as a **Buyer** (e.g. `buyer_qa@nexus.com`).
  - Search for the seller's listing.
  - Click the **Favorite** (heart) icon — verify button state updates and listing appears under Buyer's `/favorites`.
  - Click **Contact Seller** to open a conversation and send a message (e.g., *"Is this price negotiable?"*).

- [x] **Step 6: Seller Reply**
  - Return to the Seller session (`seller_qa@nexus.com`).
  - Open `/messages` or notification box.
  - Verify conversation appears with unread badge and correct `lastMessageAt` sorting.
  - Open conversation and post a reply (e.g., *"Yes, I can lower it slightly!"*).
  - Confirm buyer receives the reply in real time / upon refresh.

- [x] **Step 7: Mark Listing as Sold**
  - As Seller, navigate to `/my-listings` or listing detail page.
  - Click **Mark as Sold**.
  - Verify listing status changes to `sold`.
  - Verify it is updated on browse/search results or marked with a "SOLD" badge.

---

## 2. Viewport & Responsive Design Verification

- [x] **Desktop Viewport (>= 1024px)**
  - Navbar links and dropdowns render clearly without overlap.
  - Grid layout for listing cards displays 3 to 4 items per row.
  - Chat layout displays conversation sidebar alongside chat window.

- [x] **Mobile Viewport (<= 480px / 375px)**
  - Mobile drawer/hamburger menu opens and closes smoothly.
  - Listing cards collapse into clean 1-column layout.
  - Forms (signup, login, post listing) remain legible without horizontal overflow.
  - Chat view toggles between conversation list and active chat view cleanly.

---

## 3. Browser Console & Error Inspection

- [x] Open Developer Tools (F12) Console tab during full walkthrough.
- [x] Confirm **zero uncaught JavaScript exceptions** or unhandled promise rejections on every page navigation.
- [x] Ensure image uploads load correctly without CORS or broken link errors.

---

## 4. Slow & Failed Network Request Handling

- [x] **Network Throttling Test (Slow 3G)**
  - Enable *Slow 3G* in DevTools Network tab.
  - Perform search, submission, and page navigation.
  - Verify visual loading indicators (spinners / skeletons) appear during network wait times.

- [x] **Failed Request Test (Offline / 500 Error)**
  - Simulate offline mode or server failure during form submission / button clicks.
  - Verify the UI displays descriptive user-facing error toasts or alerts (e.g., *"Failed to connect. Please try again"*).
  - Verify UI does not freeze, crash with white screen, or fail silently.
