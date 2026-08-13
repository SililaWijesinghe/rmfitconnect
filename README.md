# RM Fit Connect

System Role: Act as an expert Full-Stack Developer specializing in React, Next.js, Tailwind CSS, and Backend-as-a-Service (Firebase/Supabase) architectures.

Project Overview: I am building a mobile-first web application for a fitness personal trainer. The app is called "RM personal training". It requires a client-facing frontend for booking time slots and updating health info, an admin panel for the trainer to manage clients, and a backend system to handle user approvals, strict booking capacities, and automated WhatsApp/SMS notifications.

Design System & UI Guidelines:

Aesthetic: Dark mode, ultra-futuristic, high-energy fitness vibe.

Colors: Deep charcoal/midnight blue backgrounds with electric cyan and magenta neon accents.

Styling: Heavy use of "glassmorphism" (translucent, blurred backdrop-filter containers, subtle white borders, soft drop shadows) and modern, clean typography (Poppins or Inter).

Core Logic & Features Required:

Onboarding & Approval Workflow:

Clients create an account providing: Name, Age, Contact Number, Profile Picture, Height, and Weight.

Crucial Logic: New accounts default to a "pending" status and cannot book sessions.

The trainer (Admin) receives a notification to approve the user.

Upon admin approval, the account status changes to "active", and a webhook triggers a WhatsApp/SMS notification to the client's phone number with their login credentials.

Health Profile (Injuries & Allergies):

Before booking, clients must be able to input/update current injuries and allergies.

This needs a highly attractive, modern form UI that feels like a premium health app.

Booking Engine (No Payments, Just Scheduling):

Time slots are strictly 1 hour each.

Morning Slots: 6:30 AM to 10:30 AM. Maximum capacity: 2 persons per slot.

Evening Slots: 3:30 PM to 10:30 PM. Maximum capacity: 4 persons per slot.

Crucial Logic: The system must check database availability. If a slot hits maximum capacity, it must be disabled or show "Full" on the frontend.

Admin Panel (Trainer Dashboard):

View pending account requests and approve/deny them.

View daily/weekly schedules and see exactly which clients are booked in which slots.

View individual client profiles (bio, health info, booking history).

Your Tasks (Please generate the following in order):

Step 1: Database Schema Map out the required NoSQL (Firebase) or relational (Supabase/PostgreSQL) database schema. I need tables/collections for Users, Bookings, and HealthProfiles. Detail the fields and relationships, specifically how to handle the "pending" status and capacity counting.

Step 2: Backend Logic & Webhooks Write the serverless function (Node.js/Edge) that listens for a user status change from "pending" to "active" and triggers a mock WhatsApp API/Twilio request to send the activation message.

Step 3: Complex Frontend Logic (React) Write the React component logic and state management for the booking screen. Show how you would filter available times, check the 2-person morning cap and 4-person evening cap, and disable full slots using Tailwind CSS for the UI states.

Step 4: Form UI Provide the React + Tailwind CSS code for the "Injuries & Allergies" update form, ensuring it utilizes the dark glassmorphic design system.
The attached images are screenshots of the desired screens. Here are public links to the html of the screens which you should read and use to build the app: 1. https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAwMDY1NWNkZTJiMWJlM2IwN2M0YzlhNGQyMDc5MzEyEgsSBxCYid-SvRMYAZIBIgoKcHJvamVjdF9pZBIUQhIxNzk0NzEwNTkwODc4OTMzNTc&filename=&opi=89354086

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rmfitconnect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3ed8520c-bfec-4929-9e0c-5209fa76f570).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
