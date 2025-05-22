import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/utils/stripe';
import { createClient } from '@/utils/supabase/server';
import { updateUserCredits } from '@/lib/prisma';
import { PLANS } from "@/utils/plans";

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();
    
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Handle free plan without Stripe
    if (priceId === 'free') {
      const plan = PLANS.find(p => p.id === 'free');
      if (!plan) {
        return new NextResponse('Invalid plan', { status: 400 });
      }

      await updateUserCredits(user.id, {
        plan: 'free',
        summariesLeft: plan.summariesLimit,
        subscriptionStatus: 'active',
      });

      return NextResponse.json({ url: '/dashboard/billing?success=true' });
    }

    // Handle paid plans with Stripe
    const session = await createCheckoutSession(priceId, user.email!);
    if (!session) {
      return new NextResponse('Failed to create checkout session', { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 