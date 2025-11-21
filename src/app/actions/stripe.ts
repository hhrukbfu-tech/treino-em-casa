"use server";

import Stripe from 'stripe';

// Inicializa Stripe apenas se a chave estiver configurada
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey || secretKey === '') {
    throw new Error('STRIPE_SECRET_KEY não configurada. Configure nas variáveis de ambiente para habilitar pagamentos.');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
};

export async function createCheckoutSession(priceId: string, userId: string) {
  try {
    const stripe = getStripe();
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?canceled=true`,
      metadata: {
        userId,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw error;
  }
}

export async function createPortalSession(customerId: string) {
  try {
    const stripe = getStripe();
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    return { url: session.url };
  } catch (error) {
    console.error('Erro ao criar portal session:', error);
    throw error;
  }
}
