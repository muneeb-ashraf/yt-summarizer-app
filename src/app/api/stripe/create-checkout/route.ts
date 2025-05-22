import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/utils/stripe';
import { updateUserCredits } from '@/lib/prisma';
import { PLANS } from "@/utils/plans";
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received body:', body);

    const { priceId } = body;
    console.log('priceId:', priceId);

    const { userId, sessionClaims } = await auth();
    console.log('userId:', userId, 'sessionClaims:', sessionClaims);

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    // Use fallback email if missing
    const email = (sessionClaims?.email as string) || (userId + '@clerk.fake');
    console.log('email (using fallback if missing):', email);

    // Handle free plan
    if (priceId === 'free') {
      const plan = PLANS.find(p => p.id === 'free');
      if (!plan) {
        return new NextResponse('Invalid plan', { status: 400 });
      }
      await updateUserCredits(userId, {
        plan: 'free',
        summariesLeft: plan.summariesLimit,
        subscriptionStatus: 'active',
      });
      return NextResponse.json({ url: '/dashboard/billing?success=true' });
    }

    // Handle paid plans
    const session = await createCheckoutSession(priceId, email);
    if (!session) {
      return new NextResponse('Failed to create checkout session', { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 