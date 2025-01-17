// app/api/comparisons/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching comparisons...');
    const comparisons = await prisma.comparison.groupedComparisons();
    return NextResponse.json(comparisons || {}); // Ensure we always return an object
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating comparison:', error.stack);
    } else {
      console.error('Error creating comparison:', error);
    }
    return NextResponse.json({
      error: 'Error fetching comparisons',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Simpler version without zod
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received comparison:', body);

    // Basic validation
    if (!body.item1 || !body.item2 || body.response === undefined) {
      throw new Error('Missing required fields');
    }

    // Create the comparison
    const comparison = await prisma.comparison.create({
      data: {
        item1: body.item1,
        item2: body.item2,
        response: body.response === true || body.response === 'yes',
        timestamp: new Date(),
        fingerprint: Date.now().toString(36) + Math.random().toString(36).substring(2)
      },
    });

    if (!comparison) {
      throw new Error('Failed to create comparison');
    }

    return NextResponse.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating comparison:', error.stack);
    } else {
      console.error('Error creating comparison:', error);
    }
    return NextResponse.json({
      success: false,
      error: 'Error creating comparison',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}