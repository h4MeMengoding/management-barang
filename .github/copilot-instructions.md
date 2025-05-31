# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js TypeScript project for item management system with the following features:
- Item management with locker organization
- QR code generation and scanning for lockers
- Google OAuth authentication
- MongoDB database integration
- Modern UI with Tailwind CSS

## Project Structure
- Uses Next.js App Router
- TypeScript for type safety
- Tailwind CSS for styling
- MongoDB for data persistence
- NextAuth.js for Google OAuth

## Code Guidelines
- Use TypeScript interfaces for type definitions
- Follow React best practices with hooks
- Use Tailwind CSS classes for styling
- Implement proper error handling
- Use Next.js API routes for backend functionality
- Follow RESTful API design patterns

## Database Schema
- Users: Google OAuth user data
- Lockers: QR code, label, description
- Items: name, description, category, locker association
