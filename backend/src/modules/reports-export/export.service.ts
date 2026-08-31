import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import {
  createPdfDoc,
  addHeader,
  addInfoSection,
  addTable,
  addSummary,
  addFooter,
} from '../../utils/pdf';

export class ExportService {
  /**
   * Helper to resolve student by id or userId
   */
  private static async findStudent(studentId: string) {
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { userId: studentId }],
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        class: true,
        school: true,
      },
    });

    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student record not found');
    }

    return student;
  }

  /**
   * Generate PDF Grade Report for a student
   */
  static async generateGradeReport(studentId: string, classId?: string): Promise<PDFKit.PDFDocument> {
    const student = await this.findStudent(studentId);

    const grades = await prisma.grade.findMany({
      where: {
        studentId: student.id,
        ...(classId && { classId }),
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        class: true,
      },
      orderBy: { date: 'desc' },
    });

    const doc = createPdfDoc();

    const studentName = student.user?.profile
      ? `${student.user.profile.firstName} ${student.user.profile.lastName || ''}`.trim()
      : student.user?.username || 'Student';

    const className = student.class?.name || 'N/A';
    const schoolName = student.school?.name || 'School Management Platform';

    // Calculate dates
    let dateRange = 'All Time';
    if (grades.length > 0) {
      const dates = grades.map((g) => new Date(g.date).getTime());
      const minDate = new Date(Math.min(...dates)).toLocaleDateString();
      const maxDate = new Date(Math.max(...dates)).toLocaleDateString();
      dateRange = minDate === maxDate ? minDate : `${minDate} - ${maxDate}`;
    }

    // Group grades by subject & calculate averages
    const subjectMap: Record<
      string,
      { subjectName: string; count: number; totalWeightedScore: number; totalWeight: number; grades: typeof grades }
    > = {};

    grades.forEach((g) => {
      const sName = g.subject?.name || 'Other';
      if (!subjectMap[sName]) {
        subjectMap[sName] = {
          subjectName: sName,
          count: 0,
          totalWeightedScore: 0,
          totalWeight: 0,
          grades: [],
        };
      }

      const scorePct = (g.score / (g.maxScore || 10)) * 100;
      const weight = g.weight || 1.0;

      subjectMap[sName].count += 1;
      subjectMap[sName].totalWeightedScore += scorePct * weight;
      subjectMap[sName].totalWeight += weight;
      subjectMap[sName].grades.push(g);
    });

    const subjectAverages = Object.values(subjectMap).map((sub) => {
      const avg = sub.totalWeight > 0 ? sub.totalWeightedScore / sub.totalWeight : 0;
      return {
        subjectName: sub.subjectName,
        count: sub.count,
        averagePct: Math.round(avg * 10) / 10,
      };
    });

    const overallAverage =
      subjectAverages.length > 0
        ? Math.round(
            (subjectAverages.reduce((sum, s) => sum + s.averagePct, 0) / subjectAverages.length) * 10
          ) / 10
        : 0;

    // Build PDF content
    addHeader(
      doc,
      'Academic Grade Report',
      `Detailed Academic Performance for ${studentName}`,
      schoolName
    );

    addInfoSection(doc, [
      { label: 'Student Name', value: studentName },
      { label: 'Class', value: className },
      { label: 'Date Range', value: dateRange },
      { label: 'Total Grades Recorded', value: String(grades.length) },
    ]);

    // Subject Averages Summary Table
    if (subjectAverages.length > 0) {
      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Subject Performance Summary', 50, doc.y, { align: 'left' });
      doc.y += 6;

      const summaryHeaders = ['Subject', 'Grades Count', 'Average Score (%)'];
      const summaryRows = subjectAverages.map((s) => [
        s.subjectName,
        s.count,
        `${s.averagePct}%`,
      ]);

      addTable(doc, summaryHeaders, summaryRows, [215, 140, 140]);
    }

    // Detailed Grades List Table
    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Detailed Grade Records', 50, doc.y, { align: 'left' });
    doc.y += 6;

    const detailHeaders = ['Date', 'Subject', 'Type', 'Score', 'Term', 'Teacher'];
    const detailRows = grades.map((g) => {
      const teacherName = g.teacher?.user?.profile
        ? `${g.teacher.user.profile.firstName} ${g.teacher.user.profile.lastName || ''}`.trim()
        : 'Teacher';

      return [
        new Date(g.date).toLocaleDateString(),
        g.subject?.name || 'N/A',
        g.type || 'WRITTEN',
        `${g.score} / ${g.maxScore || 10}`,
        `Term ${g.term || '1'}`,
        teacherName,
      ];
    });

    addTable(doc, detailHeaders, detailRows, [80, 120, 85, 70, 50, 90]);

    // Overall Summary
    addSummary(doc, [
      { label: 'Overall Academic Average', value: `${overallAverage}%` },
      { label: 'Total Subjects Evaluated', value: subjectAverages.length },
      { label: 'Total Grade Records', value: grades.length },
    ]);

    addFooter(doc);
    doc.end();

    return doc;
  }

  /**
   * Generate PDF Attendance Report for a student
   */
  static async generateAttendanceReport(studentId: string, classId?: string): Promise<PDFKit.PDFDocument> {
    const student = await this.findStudent(studentId);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        ...(classId && { classId }),
      },
      include: {
        class: true,
        subject: true,
        teacher: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const doc = createPdfDoc();

    const studentName = student.user?.profile
      ? `${student.user.profile.firstName} ${student.user.profile.lastName || ''}`.trim()
      : student.user?.username || 'Student';

    const className = student.class?.name || 'N/A';
    const schoolName = student.school?.name || 'School Management Platform';

    // Summary counts
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let earlyLeaveCount = 0;

    attendanceRecords.forEach((r) => {
      switch (r.status) {
        case 'PRESENT':
          presentCount++;
          break;
        case 'ABSENT':
          absentCount++;
          break;
        case 'LATE':
          lateCount++;
          break;
        case 'EXCUSED':
          excusedCount++;
          break;
        case 'EARLY_LEAVE':
          earlyLeaveCount++;
          break;
      }
    });

    const totalRecords = attendanceRecords.length;
    const attendanceRate = totalRecords > 0
      ? Math.round(((presentCount + excusedCount) / totalRecords) * 100)
      : 0;

    let dateRange = 'All Time';
    if (attendanceRecords.length > 0) {
      const dates = attendanceRecords.map((r) => new Date(r.date).getTime());
      const minDate = new Date(Math.min(...dates)).toLocaleDateString();
      const maxDate = new Date(Math.max(...dates)).toLocaleDateString();
      dateRange = minDate === maxDate ? minDate : `${minDate} - ${maxDate}`;
    }

    // Build PDF content
    addHeader(
      doc,
      'Student Attendance Report',
      `Attendance Log & Summary for ${studentName}`,
      schoolName
    );

    addInfoSection(doc, [
      { label: 'Student Name', value: studentName },
      { label: 'Class', value: className },
      { label: 'Date Range', value: dateRange },
      { label: 'Attendance Rate', value: `${attendanceRate}%` },
    ]);

    // Attendance Summary Box
    addSummary(doc, [
      { label: 'Present', value: presentCount },
      { label: 'Absent', value: absentCount },
      { label: 'Late', value: lateCount },
      { label: 'Excused', value: excusedCount },
      { label: 'Early Leave', value: earlyLeaveCount },
      { label: 'Total Sessions Recorded', value: totalRecords },
    ]);

    // Detailed Log Table
    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Detailed Attendance Log', 50, doc.y, { align: 'left' });
    doc.y += 6;

    const tableHeaders = ['Date', 'Status', 'Class', 'Subject', 'Notes'];
    const tableRows = attendanceRecords.map((r) => [
      new Date(r.date).toLocaleDateString(),
      r.status,
      r.class?.name || className,
      r.subject?.name || 'General',
      r.note || '-',
    ]);

    addTable(doc, tableHeaders, tableRows, [90, 80, 85, 110, 130]);

    addFooter(doc);
    doc.end();

    return doc;
  }

  /**
   * Generate Class Summary Report (grades & attendance for all students in a class)
   */
  static async generateClassReport(classId: string): Promise<PDFKit.PDFDocument> {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        school: true,
        students: {
          include: {
            user: {
              include: { profile: true },
            },
            grades: true,
            attendance: true,
          },
        },
      },
    });

    if (!classData) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    const doc = createPdfDoc();

    const schoolName = classData.school?.name || 'School Management Platform';
    const className = `${classData.name} (Grade ${classData.grade})`;

    let classTotalGrades = 0;
    let classTotalScorePctSum = 0;
    let classTotalPresent = 0;
    let classTotalAttendance = 0;

    const studentRows = classData.students.map((st) => {
      const stName = st.user?.profile
        ? `${st.user.profile.firstName} ${st.user.profile.lastName || ''}`.trim()
        : st.user?.username || 'Student';

      // Grade calculations
      const grades = st.grades || [];
      classTotalGrades += grades.length;
      let stWeightedPctSum = 0;
      let stWeightSum = 0;

      grades.forEach((g) => {
        const pct = (g.score / (g.maxScore || 10)) * 100;
        const w = g.weight || 1.0;
        stWeightedPctSum += pct * w;
        stWeightSum += w;
      });

      const stAvgPct = stWeightSum > 0 ? Math.round((stWeightedPctSum / stWeightSum) * 10) / 10 : null;
      if (stAvgPct !== null) {
        classTotalScorePctSum += stAvgPct;
      }

      // Attendance calculations
      const att = st.attendance || [];
      classTotalAttendance += att.length;
      const presentCount = att.filter((a) => a.status === 'PRESENT' || a.status === 'EXCUSED').length;
      const absentCount = att.filter((a) => a.status === 'ABSENT').length;

      classTotalPresent += presentCount;
      const attRate = att.length > 0 ? Math.round((presentCount / att.length) * 100) : null;

      return {
        name: stName,
        gradesCount: grades.length,
        average: stAvgPct !== null ? `${stAvgPct}%` : 'N/A',
        attendanceRate: attRate !== null ? `${attRate}%` : 'N/A',
        absences: absentCount,
      };
    });

    // Class overall averages
    const studentsWithAvg = studentRows.filter((r) => r.average !== 'N/A');
    const classOverallAvg =
      studentsWithAvg.length > 0
        ? Math.round((classTotalScorePctSum / studentsWithAvg.length) * 10) / 10
        : 0;

    const classOverallAttRate =
      classTotalAttendance > 0
        ? Math.round((classTotalPresent / classTotalAttendance) * 100)
        : 0;

    // Build PDF content
    addHeader(
      doc,
      'Class Performance & Attendance Report',
      `Summary Report for Class ${classData.name}`,
      schoolName
    );

    addInfoSection(doc, [
      { label: 'Class Name', value: className },
      { label: 'Total Enrolled Students', value: String(classData.students.length) },
      { label: 'Class Grade Average', value: `${classOverallAvg}%` },
      { label: 'Class Attendance Rate', value: `${classOverallAttRate}%` },
    ]);

    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Student Summary Roster', 50, doc.y, { align: 'left' });
    doc.y += 6;

    const tableHeaders = ['Student Name', 'Grades Count', 'Overall Avg', 'Attendance Rate', 'Absences'];
    const tableRows = studentRows.map((r) => [
      r.name,
      r.gradesCount,
      r.average,
      r.attendanceRate,
      r.absences,
    ]);

    addTable(doc, tableHeaders, tableRows, [165, 80, 80, 95, 75]);

    addSummary(doc, [
      { label: 'Class Average Grade', value: `${classOverallAvg}%` },
      { label: 'Class Overall Attendance Rate', value: `${classOverallAttRate}%` },
      { label: 'Total Enrolled Students', value: classData.students.length },
      { label: 'Total Recorded Grades', value: classTotalGrades },
    ]);

    addFooter(doc);
    doc.end();

    return doc;
  }
}
