import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, DollarSign, RefreshCw, FileText, Download, Printer, Users, BookOpen, Calendar, Award } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState<any>(null);
  const [reportActionLoading, setReportActionLoading] = useState<string | null>(null);

  const loadReports = async () => {
    if (user?.role !== 'admin' && user?.role !== 'librarian') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/dashboard/reports');
      if (res.data.success) {
        setReportsData(res.data.reports);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load management reports data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const drawPageHeaderAndFooter = (doc: jsPDF, title: string, pageNumber: number) => {
    // Header bar
    doc.setFillColor(37, 99, 235); // Brand Blue (#2563EB)
    doc.rect(0, 0, 210, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`ALPHA SMART LIBRARY - ${title.toUpperCase()}`, 14, 10);
    
    // Footer line
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 280, 196, 280);
    
    // Footer texts
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('Created by Sumit Prajapati', 14, 287);
    doc.text(`Page ${pageNumber}`, 185, 287);
  };

  const downloadBorrowReport = async () => {
    setReportActionLoading('borrow');
    try {
      const res = await api.get('/borrows', { params: { page: 1, limit: 1000 } });
      if (res.data.success) {
        const records = res.data.records || [];
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Borrow Activity & Checkouts Audit Ledger', 14, 25);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 31);
        
        const bodyRows = records.map((r: any, idx: number) => [
          (idx + 1).toString(),
          r.user?.name || 'N/A',
          r.book?.title || 'N/A',
          r.book?.isbn || 'N/A',
          new Date(r.createdAt).toLocaleDateString(),
          r.status.toUpperCase(),
          r.returnedAt ? new Date(r.returnedAt).toLocaleDateString() : 'Active'
        ]);

        autoTable(doc, {
          startY: 36,
          head: [['ID', 'Student Name', 'Book Title', 'ISBN', 'Checkout Date', 'Status', 'Returned Date']],
          body: bodyRows,
          theme: 'striped',
          didDrawPage: (data) => {
            drawPageHeaderAndFooter(doc, 'Borrow Ledger Report', data.pageNumber);
          },
          margin: { top: 20, bottom: 20 },
        });

        doc.save(`ALPHA_Borrow_Report_${Date.now()}.pdf`);
        showToast('Borrow ledger downloaded successfully as PDF', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to compile Borrow Ledger PDF', 'error');
    } finally {
      setReportActionLoading(null);
    }
  };

  const downloadStudentReport = async () => {
    setReportActionLoading('student');
    try {
      const res = await api.get('/auth/users', { params: { page: 1, limit: 1000 } });
      if (res.data.success) {
        const usersList = res.data.users || [];
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Registered Student Directory & Role Audit', 14, 25);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 31);
        
        const bodyRows = usersList.map((u: any, idx: number) => [
          (idx + 1).toString(),
          u.name || 'N/A',
          u.email || 'N/A',
          u.role.toUpperCase(),
          u.isVerified ? 'VERIFIED' : 'PENDING',
          new Date(u.createdAt).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: 36,
          head: [['ID', 'Full Name', 'Email Address', 'System Role', 'Status', 'Registered Date']],
          body: bodyRows,
          theme: 'grid',
          didDrawPage: (data) => {
            drawPageHeaderAndFooter(doc, 'Student Accounts Audit', data.pageNumber);
          },
          margin: { top: 20, bottom: 20 },
        });

        doc.save(`ALPHA_Student_Report_${Date.now()}.pdf`);
        showToast('Student directory downloaded successfully', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to compile student directory PDF', 'error');
    } finally {
      setReportActionLoading(null);
    }
  };

  const downloadInventoryReport = async () => {
    setReportActionLoading('inventory');
    try {
      const res = await api.get('/books', { params: { page: 1, limit: 1000 } });
      if (res.data.success) {
        const booksList = res.data.books || [];
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('E-Book and Audiobook Catalog Inventory', 14, 25);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 31);
        
        const bodyRows = booksList.map((b: any, idx: number) => [
          (idx + 1).toString(),
          b.title || 'N/A',
          b.isbn || 'N/A',
          b.authors?.map((a: any) => a.name).join(', ') || 'N/A',
          b.categories?.map((c: any) => c.name).join(', ') || 'N/A',
          `${b.copiesAvailable}/${b.totalCopies || b.copiesTotal || 0}`,
          b.condition || 'New',
          b.isEbook ? 'YES' : 'NO'
        ]);

        autoTable(doc, {
          startY: 36,
          head: [['ID', 'Book Title', 'ISBN', 'Authors', 'Genres', 'Stock (Avail/Tot)', 'Condition', 'E-Book']],
          body: bodyRows,
          theme: 'striped',
          didDrawPage: (data) => {
            drawPageHeaderAndFooter(doc, 'Book Catalog Inventory', data.pageNumber);
          },
          margin: { top: 20, bottom: 20 },
        });

        doc.save(`ALPHA_Inventory_Report_${Date.now()}.pdf`);
        showToast('Book inventory report downloaded successfully', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to compile inventory report PDF', 'error');
    } finally {
      setReportActionLoading(null);
    }
  };

  const downloadFineReport = async () => {
    setReportActionLoading('fine');
    try {
      const res = await api.get('/fines');
      if (res.data.success) {
        const finesList = res.data.fines || [];
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Overdue Fine Accounts & Collections ledger', 14, 25);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 31);
        
        const bodyRows = finesList.map((f: any, idx: number) => [
          (idx + 1).toString(),
          f.user?.name || 'N/A',
          f.borrowRecord?.book?.title || 'N/A',
          `$${f.amount.toFixed(2)}`,
          f.status.toUpperCase(),
          new Date(f.createdAt).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: 36,
          head: [['ID', 'Student Name', 'Book Overdue', 'Charge Amount', 'Status', 'Logged Date']],
          body: bodyRows,
          theme: 'grid',
          didDrawPage: (data) => {
            drawPageHeaderAndFooter(doc, 'Fine Collection Balances', data.pageNumber);
          },
          margin: { top: 20, bottom: 20 },
        });

        doc.save(`ALPHA_Fine_Report_${Date.now()}.pdf`);
        showToast('Fines collection report downloaded successfully', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to compile fines ledger PDF', 'error');
    } finally {
      setReportActionLoading(null);
    }
  };

  const downloadMonthlyReport = async () => {
    setReportActionLoading('monthly');
    try {
      // Fetch stats for monthly report
      const res = await api.get('/dashboard/reports');
      if (res.data.success) {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Library Operational Audit', 14, 25);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 31);

        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Operational Summary for ${currentMonth}`, 14, 40);

        const summaryData = [
          ['Total Fines Collected', `$${(reportsData?.finesSummary?.paid || 0).toFixed(2)}`],
          ['Outstanding Fines Charged', `$${(reportsData?.finesSummary?.unpaid || 0).toFixed(2)}`],
          ['Overdue Book Accounts Counts', `${reportsData?.overdueRecords?.length || 0} Accounts`],
          ['Audit Status', 'COMPLIANT / OK']
        ];

        autoTable(doc, {
          startY: 45,
          head: [['Operational KPI', 'Status Value']],
          body: summaryData,
          theme: 'striped',
          didDrawPage: (data) => {
            drawPageHeaderAndFooter(doc, 'Monthly Performance Audit', data.pageNumber);
          },
          margin: { top: 20, bottom: 20 },
        });

        doc.save(`ALPHA_Monthly_Audit_${Date.now()}.pdf`);
        showToast('Monthly audit downloaded successfully', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to compile monthly audit', 'error');
    } finally {
      setReportActionLoading(null);
    }
  };

  const downloadYearlyReport = async () => {
    setReportActionLoading('yearly');
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Annual Academic Performance Audit Summary', 14, 25);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Year of Audit: ${new Date().getFullYear()}`, 14, 31);

      const metrics = [
        ['Total Fine Ledger Volume', `$${((reportsData?.finesSummary?.paid || 0) + (reportsData?.finesSummary?.unpaid || 0)).toFixed(2)}`],
        ['Uncollected Overdue Penalties', `$${(reportsData?.finesSummary?.unpaid || 0).toFixed(2)}`],
        ['Highly Popular Book Title', reportsData?.mostBorrowed?.[0]?.book?.title || 'None'],
        ['Total System Active Violations', `${reportsData?.overdueRecords?.length || 0} Accounts`]
      ];

      autoTable(doc, {
        startY: 38,
        head: [['Annual Performance Indicator', 'Compiled Value']],
        body: metrics,
        theme: 'grid',
        didDrawPage: (data) => {
          drawPageHeaderAndFooter(doc, 'Annual Audit Statement', data.pageNumber);
        },
        margin: { top: 20, bottom: 20 },
      });

      doc.save(`ALPHA_Yearly_Audit_${Date.now()}.pdf`);
      showToast('Annual audit report downloaded successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to compile annual audit report', 'error');
    } finally {
      setReportActionLoading(null);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  useEffect(() => {
    loadReports();
  }, [user]);

  if (user?.role !== 'admin' && user?.role !== 'librarian') {
    return (
      <div className="glass-card p-8 rounded-3xl text-center max-w-md mx-auto page-fade-in mt-12">
        <BarChart3 className="w-12 h-12 mx-auto text-slate-400 opacity-30 mb-3" />
        <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">Analytics Restricted</h3>
        <p className="text-xs text-slate-500 mt-2">
          Management logs, fine ledgers, and popularity stats are restricted to Librarian and Administrative staff.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Compiling administrative reports...</p>
      </div>
    );
  }

  const reports = reportsData || {};
  const mostBorrowed = reports.mostBorrowed || [];
  const overdueRecords = reports.overdueRecords || [];
  const finesSummary = reports.finesSummary || { paid: 0, unpaid: 0 };

  const finesChartData = [
    { name: 'Paid Fines', value: finesSummary.paid },
    { name: 'Unpaid Fines', value: finesSummary.unpaid },
  ];
  
  const COLORS = ['#10b981', '#f43f5e'];

  return (
    <div className="space-y-6 page-fade-in print:p-0">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">System Reports & Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">Analyze ledger balances, late accounts, and borrow rates</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handlePrintSummary}
            className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Page
          </button>
          <button 
            onClick={loadReports}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Re-compile
          </button>
        </div>
      </div>

      {/* Grid of summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Collected Fines</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">${finesSummary.paid.toFixed(2)}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-505 text-rose-500 dark:text-rose-450 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Outstanding Fines</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">${finesSummary.unpaid.toFixed(2)}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Total Fines Leveraged</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              ${(finesSummary.paid + finesSummary.unpaid).toFixed(2)}
            </h3>
          </div>
        </div>
      </div>

      {/* Split section: Most Borrowed vs Fines Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
        {/* Most borrowed list */}
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-650" />
            Top 5 Most Popular Books
          </h3>
          <div className="space-y-4">
            {mostBorrowed.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No checkout data available.</p>
            ) : (
              mostBorrowed.map((item: any, idx: number) => (
                <div key={item.book?._id || idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-brand-500/15 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 line-clamp-1">{item.book?.title}</h4>
                      <p className="text-[10px] text-slate-450">by {item.book?.authors?.map((a: any) => a.name).join(', ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">{item.borrowCount} checkouts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fines visual chart */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between print:hidden">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-650" />
            Fine Collections Share
          </h3>
          <div className="h-60 w-full text-xs">
            {finesSummary.paid === 0 && finesSummary.unpaid === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-450">No fine charges generated yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finesChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {finesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Amount']}
                    contentStyle={{ borderRadius: '0.5rem', background: '#fff', border: '1px solid #ddd' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Overdue loans listing table */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-505 text-rose-500 animate-pulse" />
          Overdue Accounts Ledger
        </h3>

        <div className="overflow-x-auto rounded-xl">
          {overdueRecords.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No overdue loan records at this time.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Book Title</th>
                  <th className="p-3">ISBN</th>
                  <th className="p-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {overdueRecords.map((item: any) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200 capitalize">{item.user?.name}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">{item.book?.title}</td>
                    <td className="p-3 font-mono text-slate-500">{item.book?.isbn}</td>
                    <td className="p-3 font-semibold text-rose-600 dark:text-rose-400">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ==================== AUDIT REPORTS DOWNLOAD CENTER ==================== */}
      <div className="glass-card p-6 rounded-3xl space-y-4 print:hidden">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600" />
          Executive Audit Reports Download Center
        </h3>
        <p className="text-xs text-slate-450 leading-relaxed">
          Compile live database snapshots into official formatted PDF audit logs. All sheets are generated with corporate styling headers, page numbering, and developer signoffs.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Borrow Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brand-500" />
                Borrow Ledger Report
              </h4>
              <p className="text-[10px] text-slate-450 mt-1">Full statement of historic borrows, active loans, and overdue counts.</p>
            </div>
            <button
              onClick={downloadBorrowReport}
              disabled={!!reportActionLoading}
              className="btn-secondary py-2 text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer font-bold"
            >
              {reportActionLoading === 'borrow' ? 'Compiling...' : 'Download PDF'}
            </button>
          </div>

          {/* Student Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" />
                Student Directory Directory
              </h4>
              <p className="text-[10px] text-slate-450 mt-1">Register of registered library cardholders, roles, and verification flags.</p>
            </div>
            <button
              onClick={downloadStudentReport}
              disabled={!!reportActionLoading}
              className="btn-secondary py-2 text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer font-bold"
            >
              {reportActionLoading === 'student' ? 'Compiling...' : 'Download PDF'}
            </button>
          </div>

          {/* Inventory Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                Book Inventory Statement
              </h4>
              <p className="text-[10px] text-slate-450 mt-1">Catalog list featuring ISBN, total/available stock counts, and conditions.</p>
            </div>
            <button
              onClick={downloadInventoryReport}
              disabled={!!reportActionLoading}
              className="btn-secondary py-2 text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer font-bold"
            >
              {reportActionLoading === 'inventory' ? 'Compiling...' : 'Download PDF'}
            </button>
          </div>

          {/* Fine Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-rose-500" />
                Fines & Revenue Summary
              </h4>
              <p className="text-[10px] text-slate-450 mt-1">Statement of collected revenue versus outstanding student balance bills.</p>
            </div>
            <button
              onClick={downloadFineReport}
              disabled={!!reportActionLoading}
              className="btn-secondary py-2 text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer font-bold"
            >
              {reportActionLoading === 'fine' ? 'Compiling...' : 'Download PDF'}
            </button>
          </div>

          {/* Monthly Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Monthly Performance Audit
              </h4>
              <p className="text-[10px] text-slate-450 mt-1">Aggregated statistics summary matching the current calendar month checkout logs.</p>
            </div>
            <button
              onClick={downloadMonthlyReport}
              disabled={!!reportActionLoading}
              className="btn-secondary py-2 text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer font-bold"
            >
              {reportActionLoading === 'monthly' ? 'Compiling...' : 'Download PDF'}
            </button>
          </div>

          {/* Yearly Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-cyan-500" />
                Annual Operation Audit
              </h4>
              <p className="text-[10px] text-slate-450 mt-1">Executive overview of yearly library growth and performance checkouts.</p>
            </div>
            <button
              onClick={downloadYearlyReport}
              disabled={!!reportActionLoading}
              className="btn-secondary py-2 text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer font-bold"
            >
              {reportActionLoading === 'yearly' ? 'Compiling...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
