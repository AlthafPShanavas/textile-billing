import React, { useState } from 'react';
import { reportAPI } from '../api';
import { FiDownload } from 'react-icons/fi';
import './Reports.css';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('daily');
  const [reportData, setReportData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const handleGenerateDailyReport = async () => {
    setLoading(true);
    try {
      const response = await reportAPI.getDaily(selectedDate);
      setReportData(response.data);
    } catch (error) {
      alert('Error generating report: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await reportAPI.getMonthly(selectedYear, selectedMonth);
      setReportData(response.data);
    } catch (error) {
      alert('Error generating report: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateYearlyReport = async () => {
    setLoading(true);
    try {
      const response = await reportAPI.getYearly(selectedYear);
      setReportData(response.data);
    } catch (error) {
      alert('Error generating report: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = Object.keys(reportData[0] || {}).join(',');
    const rows = reportData.map(row => Object.values(row).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${activeReport}.csv`;
    a.click();
  };

  return (
    <div className="reports-container">
      <h2>Reports</h2>

      <div className="report-tabs">
        <button
          className={activeReport === 'daily' ? 'active' : ''}
          onClick={() => setActiveReport('daily')}
        >
          Daily Report
        </button>
        <button
          className={activeReport === 'monthly' ? 'active' : ''}
          onClick={() => setActiveReport('monthly')}
        >
          Monthly Report
        </button>
        <button
          className={activeReport === 'yearly' ? 'active' : ''}
          onClick={() => setActiveReport('yearly')}
        >
          Yearly Report
        </button>
      </div>

      <div className="report-filters">
        {activeReport === 'daily' && (
          <>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button onClick={handleGenerateDailyReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </>
        )}

        {activeReport === 'monthly' && (
          <>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>{new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}</option>
              ))}
            </select>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min="2020"
              max="2030"
            />
            <button onClick={handleGenerateMonthlyReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </>
        )}

        {activeReport === 'yearly' && (
          <>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min="2020"
              max="2030"
            />
            <button onClick={handleGenerateYearlyReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </>
        )}

        {reportData.length > 0 && (
          <button className="download-btn" onClick={downloadCSV}>
            <FiDownload /> Download CSV
          </button>
        )}
      </div>

      {reportData.length > 0 && (
        <div className="report-data">
          <table>
            <thead>
              <tr>
                {Object.keys(reportData[0]).map(key => (
                  <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, i) => (
                    <td key={i}>
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportData.length === 0 && (
        <div className="no-data">
          Select filters and click "Generate Report" to view data
        </div>
      )}
    </div>
  );
};

export default Reports;
