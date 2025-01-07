// app/api/comparisons/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // For debugging, let's first return a mock response
    return NextResponse.json({
      'bread-pastry': { yes: 5, no: 2 },
      'cookie-pastry': { yes: 8, no: 1 }
    });

    // Once we confirm the route works, we'll uncomment this:
    // const comparisons = await prisma.groupedComparisons();
    // return NextResponse.json(comparisons);
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    return NextResponse.json(
      { error: 'Error fetching comparisons' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { item1, item2, response } = await request.json();

    console.log('Received comparison:', { item1, item2, response });

    // For debugging, let's first return a mock response
    return NextResponse.json({ success: true });

    // Once we confirm the route works, we'll uncomment this:
    // const comparison = await prisma.comparison.create({
    //   data: {
    //     item1,
    //     item2,
    //     response: response === 'yes',
    //     timestamp: new Date(),
    //   },
    // });
    // return NextResponse.json(comparison);
  } catch (error) {
    console.error('Error creating comparison:', error);
    return NextResponse.json(
      { error: 'Error creating comparison' },
      { status: 500 }
    );
  }
}