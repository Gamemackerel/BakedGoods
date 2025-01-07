// app/api/comparisons/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { item1, item2, response } = await request.json();

    const comparison = await prisma.comparison.create({
      data: {
        item1,
        item2,
        response: response === 'yes',
        timestamp: new Date(),
      },
    });

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Error creating comparison:', error);
    return NextResponse.json(
      { error: 'Error creating comparison' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const comparisons = await prisma.groupedComparisons();
    return NextResponse.json(comparisons);
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    return NextResponse.json(
      { error: 'Error fetching comparisons' },
      { status: 500 }
    );
  }
}