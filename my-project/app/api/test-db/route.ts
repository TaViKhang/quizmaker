import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Thử kết nối đến database
    await prisma.$connect()
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Database connection successful' 
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 