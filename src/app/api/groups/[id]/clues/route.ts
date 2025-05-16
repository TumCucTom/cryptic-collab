import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

function getCookieValue(cookieString: string | null, name: string): string | undefined {
  if (!cookieString) return undefined;
  const match = cookieString.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : undefined;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the group exists
    const group = await prisma.group.findUnique({
      where: { id: params.id },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const clues = await prisma.clue.findMany({
      where: { groupId: params.id },
      include: {
        author: { select: { name: true } },
        solutions: {
          select: {
            correct: true,
            member: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(clues);
  } catch (error) {
    console.error('Failed to fetch clues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clues' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the group exists
    const group = await prisma.group.findUnique({
      where: { id: params.id },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const { text, answer } = await request.json();
    const cookieHeader = request.headers.get('cookie');
    const memberId = getCookieValue(cookieHeader, 'memberId');

    if (!text || !answer || !memberId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the member exists and belongs to this group
    const member = await prisma.member.findFirst({
      where: { 
        id: memberId,
        groupId: params.id
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found or not in this group' },
        { status: 404 }
      );
    }

    const clue = await prisma.clue.create({
      data: {
        text,
        answer: answer.toUpperCase(),
        authorId: memberId,
        groupId: params.id,
      },
      include: {
        author: { select: { name: true } },
        solutions: {
          select: {
            correct: true,
            member: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(clue);
  } catch (error) {
    console.error('Failed to create clue:', error);
    return NextResponse.json(
      { error: 'Failed to create clue' },
      { status: 500 }
    );
  }
} 