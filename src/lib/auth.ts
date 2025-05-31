import { NextAuthOptions, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

// Type guard to check if session has user
export function isValidSession(session: Session | null): session is Session & {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
} {
  return !!(session?.user?.email);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await dbConnect();
          
          const existingUser = await User.findOne({ 
            $or: [
              { email: user.email },
              { googleId: account.providerAccountId }
            ]
          });
          
          if (!existingUser) {
            // Create new user with googleId from account
            await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId, // This is the Google ID
            });
          } else if (!existingUser.googleId) {
            // Update existing user with googleId if missing
            await User.findByIdAndUpdate(existingUser._id, {
              googleId: account.providerAccountId,
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // Store the user ID in the token on first sign in
      if (account && user) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Include the user ID in the session
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
};