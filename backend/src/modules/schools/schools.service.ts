import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';

export class SchoolService {
  static async findAll(query: {
    page?: number;
    limit?: number;
    skip?: number;
    search?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, skip = 0, search, sortBy = 'createdAt', sortDir = 'desc' } = query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
        include: {
          _count: {
            select: {
              classes: true,
              subjects: true,
              teachers: true,
              students: true,
            },
          },
        },
      }),
      prisma.school.count({ where }),
    ]);

    return { schools, total, page, limit };
  }

  static async findById(id: string) {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classes: true,
            subjects: true,
            teachers: true,
            students: true,
            announcements: true,
          },
        },
      },
    });

    if (!school) {
      throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'School not found');
    }

    return school;
  }

  static async create(data: {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
    adminId?: string | null;
  }) {
    if (data.email) {
      const existing = await prisma.school.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new ApiError(409, 'EMAIL_EXISTS', 'A school with this email already exists');
      }
    }

    if (data.adminId) {
      const adminUser = await prisma.user.findUnique({
        where: { id: data.adminId },
      });
      if (!adminUser) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'Specified admin user does not exist');
      }
    }

    const school = await prisma.school.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        country: data.country,
        phone: data.phone,
        email: data.email || null,
        website: data.website,
        logo: data.logo,
        adminId: data.adminId || null,
      },
      include: {
        _count: {
          select: {
            classes: true,
            subjects: true,
            teachers: true,
            students: true,
          },
        },
      },
    });

    return school;
  }

  static async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      address?: string | null;
      city?: string | null;
      country?: string | null;
      phone?: string | null;
      email?: string | null;
      website?: string | null;
      logo?: string | null;
      adminId?: string | null;
    },
  ) {
    const existingSchool = await prisma.school.findUnique({ where: { id } });
    if (!existingSchool) {
      throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'School not found');
    }

    if (data.email && data.email !== existingSchool.email) {
      const existingEmail = await prisma.school.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new ApiError(409, 'EMAIL_EXISTS', 'A school with this email already exists');
      }
    }

    if (data.adminId && data.adminId !== existingSchool.adminId) {
      const adminUser = await prisma.user.findUnique({
        where: { id: data.adminId },
      });
      if (!adminUser) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'Specified admin user does not exist');
      }
    }

    const updated = await prisma.school.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            classes: true,
            subjects: true,
            teachers: true,
            students: true,
          },
        },
      },
    });

    return updated;
  }

  static async delete(id: string) {
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
      throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'School not found');
    }

    await prisma.school.delete({ where: { id } });
    return { id };
  }

  static async findClasses(
    schoolId: string,
    query: { page?: number; limit?: number; skip?: number; search?: string },
  ) {
    await SchoolService.findById(schoolId);

    const { limit = 10, skip = 0, page = 1, search } = query;
    const where: any = { schoolId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { section: { contains: search, mode: 'insensitive' } },
        { room: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              students: true,
              lessons: true,
              homework: true,
            },
          },
        },
      }),
      prisma.class.count({ where }),
    ]);

    return { classes, total, page, limit };
  }

  static async findSubjects(
    schoolId: string,
    query: { page?: number; limit?: number; skip?: number; search?: string },
  ) {
    await SchoolService.findById(schoolId);

    const { limit = 10, skip = 0, page = 1, search } = query;
    const where: any = { schoolId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { language: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              teachers: true,
              lessons: true,
              homework: true,
            },
          },
        },
      }),
      prisma.subject.count({ where }),
    ]);

    return { subjects, total, page, limit };
  }
}
