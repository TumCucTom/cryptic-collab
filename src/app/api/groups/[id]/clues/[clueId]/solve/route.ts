import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

function getCookieValue(cookieString: string | null, name: string): string | undefined {
  if (!cookieString) return undefined;
  const match = cookieString.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : undefined;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; clueId: string } }
) {
  try {
    // Explicitly destructure and validate params first
    const { id, clueId } = params;
    if (!id || !clueId) {
      return NextResponse.json(
        { error: 'Invalid route parameters' },
        { status: 400 }
      );
    }

    const { answer } = await request.json();
    const cookieHeader = request.headers.get('cookie');
    const memberId = getCookieValue(cookieHeader, 'memberId');

    if (!answer || !memberId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const clue = await prisma.clue.findUnique({
      where: { id: clueId },
    });

    if (!clue) {
      return NextResponse.json(
        { error: 'Clue not found' },
        { status: 404 }
      );
    }

    // Check if member has already solved this clue
    const existingSolution = await prisma.solution.findFirst({
      where: {
        clueId,
        memberId,
      },
    });

    if (existingSolution) {
      return NextResponse.json(
        { error: 'You have already attempted this clue' },
        { status: 400 }
      );
    }

    const isCorrect = answer.toUpperCase() === clue.answer;

    // Create the solution
    const solution = await prisma.solution.create({
      data: {
        answer: answer.toUpperCase(),
        correct: isCorrect,
        memberId,
        clueId,
      },
    });

    // If correct, update the member's score
    if (isCorrect) {
      await prisma.member.update({
        where: { id: memberId },
        data: {
          score: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({
      correct: isCorrect,
      solution,
    });
  } catch (error) {
    console.error('Failed to submit solution:', error);
    return NextResponse.json(
      { error: 'Failed to submit solution' },
      { status: 500 }
    );
  }
} 