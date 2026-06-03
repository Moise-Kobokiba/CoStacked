// backend/controllers/reportController.js

const Report = require('../models/Report');
const Project = require('../models/Project');
const User = require('../models/User'); // Corrected casing
const AdminNotification = require('../models/AdminNotification'); // For admin panel notifications

/**
 * @desc    Create a new content report or support ticket
 * @route   POST /api/reports
 * @access  Private (Logged-in users only)
 */
const createReport = async (req, res) => {
  try {
    const { type, reportedId, reason, comment } = req.body;
    const reporterId = req.user._id;

    if (!reason) {
      return res.status(400).json({ message: 'A reason for the report is required.' });
    }

    let reportPayload = {
      reporter: reporterId,
      reason,
      comment,
    };

    if (type === 'project') {
      if (!reportedId) return res.status(400).json({ message: 'A project ID is required for a project report.' });
      const project = await Project.findById(reportedId);
      if (!project) return res.status(404).json({ message: 'Project to report not found.' });
      reportPayload.reportedProject = reportedId;

      const existingReport = await Report.findOne({ reporter: reporterId, reportedProject: reportedId });
      if (existingReport) {
        return res.status(400).json({ message: 'You have already reported this project.' });
      }

    } else if (type === 'user') {
      if (!reportedId) return res.status(400).json({ message: 'A user ID is required for a user report.' });
      const user = await User.findById(reportedId);
      if (!user) return res.status(404).json({ message: 'User to report not found.' });
      reportPayload.reportedUser = reportedId;

      const existingReport = await Report.findOne({ reporter: reporterId, reportedUser: reportedId });
      if (existingReport) {
        return res.status(400).json({ message: 'You have already reported this user.' });
      }
    } 
    
    const report = await Report.create(reportPayload);

    // --- CREATE ADMIN NOTIFICATION ---
    await AdminNotification.create({
        type: 'NEW_REPORT_SUBMITTED',
        message: `A new report/ticket for "${report.reason}" was submitted by ${req.user.name}.`,
        link: '/reports',
        refId: report._id
    });

    res.status(201).json({ message: 'Your request has been submitted successfully. Our team will get back to you shortly.' });

  } catch (error) {
    console.error(`[CREATE REPORT ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while submitting report.' });
  }
};

/**
 * @desc    Get user's submitted reports and support tickets
 * @route   GET /api/reports/my-reports
 * @access  Private
 */
const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .populate('reportedUser', 'name avatarUrl')
      .populate('reportedProject', 'title')
      .populate('messages.sender', 'name avatarUrl role') // To see admin names/avatars
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error(`[GET MY REPORTS ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching reports' });
  }
};

/**
 * @desc    Add a message to an existing report (User side)
 * @route   POST /api/reports/:id/messages
 * @access  Private
 */
const addReportMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Message content is required.' });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Verify it belongs to the user
    if (report.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reply to this report.' });
    }

    report.messages.push({
      sender: req.user._id,
      senderModel: 'User',
      content
    });

    await report.save();
    
    // We should populate the newly added message's sender for the frontend
    await report.populate('messages.sender', 'name avatarUrl role');

    // Notify admins
    await AdminNotification.create({
      type: 'REPORT_REPLY',
      message: `${req.user.name} added a reply to ticket #${report._id.toString().slice(-4)}`,
      link: '/reports',
      refId: report._id
    });

    res.json(report);
  } catch (error) {
    console.error(`[ADD REPORT MESSAGE ERROR]: ${error.message}`);
    res.status(500).json({ message: 'Server error while adding message.' });
  }
};

module.exports = { createReport, getMyReports, addReportMessage };