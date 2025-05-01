// pages/api/create-user.ts
import {prisma} from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, username, email, password, city, country } = req.body;

    // Add input validation (optional but recommended)
    if (!username || !email || !password || !name) {
        return res.status(400).json({ message: 'Missing required fields (name, username, email, password)'});
    }

    try {
      // Check if username or email already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: email },
          ],
        },
      });

      if (existingUser) {
        return res.status(409).json({ message: 'Username or email already exists' });
      }

      // If no existing user, create the new user
      // IMPORTANT: Implement password hashing here before saving!
      const user = await prisma.user.create({
        data: {
          name,
          username,
          email,
          password, // Remember to hash this!
          city,
          country,
        },
      });

      // Don't send the password back
      const { password: _, ...userData } = user;
      res.status(200).json(userData);

    } catch (error) {
      console.error("Registration error:", error);
      // Check if it's a known Prisma error, otherwise generic 500
      // Perform type check before accessing error properties
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ message: 'Username or email already exists' });
      }
      res.status(500).json({ message: 'Internal server error during registration' });
    }

  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}