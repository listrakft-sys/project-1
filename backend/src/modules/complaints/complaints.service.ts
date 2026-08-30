import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';
import { JwtPayload } from '../../utils/jwt';
import { ComplaintStatus, ComplaintType } from '@prisma/client';
import { CreateComplaintInput, HandleComplaintInput } from './complaints.schema';

export class ComplaintService {
  /**
   * List all complaints with filters for status, type, and pagination.
   * Admin only (SUPER_ADMIN, SCHOOL_ADMIN).
   */
  static async findAll(query: any, currentUser: JwtPayload) {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'SCHOOL_ADMIN') {
      throw new ApiError(403, 'FORBIDDEN', 'Only administrators can list complaints');
    }

    const { page, limit, skip } = getPagination({ query } as any);
    const { status, type, search } = query;

    const where: any = {};

    if (status) {
      where.status = status as ComplaintStatus;
    }

    if (type) {
      where.type = type as ComplaintType;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { resolution: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          filedBy: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          againstUser: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          handledBy: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    return { data: complaints, total, page, limit };
  }

  /**
   * Find complaint by ID.
   * Only accessible by the filer or an administrator.
   */
  static async findById(id: string, currentUser: JwtPayload) {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        filedBy: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        againstUser: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        handledBy: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!complaint) {
      throw new ApiError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SCHOOL_ADMIN';
    const isFiler = complaint.filedById === currentUser.userId;

    if (!isAdmin && !isFiler) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied to this complaint');
    }

    return complaint;
  }

  /**
   * Create a new complaint.
   * Filed by any authenticated user against another user.
   */
  static async create(data: CreateComplaintInput, currentUser: JwtPayload) {
    if (data.againstUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: data.againstUserId },
      });

      if (!targetUser) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'Target user to complain against not found');
      }
    }

    const complaint = await prisma.complaint.create({
      data: {
        filedById: currentUser.userId,
        againstUserId: data.againstUserId || null,
        type: data.type || ComplaintType.OTHER,
        description: data.description,
        evidence: data.evidence || [],
        status: ComplaintStatus.PENDING,
      },
      include: {
        filedBy: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        againstUser: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return complaint;
  }

  /**
   * Handle or resolve a complaint.
   * Admin only — sets status, resolution, and handledById to current user.
   */
  static async handle(id: string, data: HandleComplaintInput, currentUser: JwtPayload) {
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SCHOOL_ADMIN';
    if (!isAdmin) {
      throw new ApiError(403, 'FORBIDDEN', 'Only administrators can handle complaints');
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new ApiError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    const updateData: any = {
      status: data.status as ComplaintStatus,
      handledById: currentUser.userId,
    };

    if (data.resolution !== undefined) {
      updateData.resolution = data.resolution;
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        filedBy: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        againstUser: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        handledBy: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return updatedComplaint;
  }
}
