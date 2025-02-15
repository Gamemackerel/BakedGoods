// app/api/comparisons/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get all comparisons for stats
    const comparisons = await prisma.comparison.groupedComparisons();

    // If userId provided, get user's previous votes
    let userVotes: {item1: string, item2: string}[] = [];
    if (userId) {
      userVotes = await prisma.comparison.findMany({
        where: { userId },
        select: { item1: true, item2: true }
      });
    }

    return NextResponse.json({
      comparisons: comparisons || {},
      userVotes
    });
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    return NextResponse.json({
      error: 'Error fetching comparisons',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.item1 || !body.item2 || body.response === undefined || !body.userId) {
      throw new Error('Missing required fields');
    }

    // Create the comparison
    const comparison = await prisma.comparison.create({
      data: {
        item1: body.item1,
        item2: body.item2,
        response: body.response === true || body.response === 'yes',
        timestamp: new Date(),
        userId: body.userId
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
    console.error('Error creating comparison:', error);
    return NextResponse.json({
      success: false,
      error: 'Error creating comparison',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}