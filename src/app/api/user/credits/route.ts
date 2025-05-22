import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user credits from database
    const credits = await prisma.credits.findUnique({
      where: { userId },
      select: {
        plan: true,
        summariesLeft: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        subscriptionId: true,
      },
    });

    if (!credits) {
      // If no credits record exists, create one with free plan
      const newCredits = await prisma.credits.create({
        data: {
          userId,
          plan: 'free',
          summariesLeft: 3, // Free plan limit
          subscriptionStatus: 'active',
        },
        select: {
          plan: true,
          summariesLeft: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
          subscriptionId: true,
        },
      });
      return NextResponse.json(newCredits);
    }

    return NextResponse.json(credits);
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 