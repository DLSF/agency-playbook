import { PlaybookPage, UserDirectory } from './types';

export const PLAYBOOK_PAGES: PlaybookPage[] = [
  { name: "After Sales", url: "/after-sales", description: "Post-sale follow-up and documentation.", icon: "💰", tag: "Sales" },
  { name: "Check In", url: "/check-in", description: "Client check-in procedures.", icon: "✅", tag: "Service" },
  { name: "Closing", url: "/closing", description: "Closing techniques and scripts.", icon: "🤝", tag: "Sales" },
  { name: "Continuing Ed", url: "/continuing-ed", description: "CE requirements and tracking.", icon: "🎓", tag: "Licensing" },
  { name: "Dashboard", url: "/dashboard", description: "Main hub for all playbook resources.", icon: "📊", tag: "Main" },
  { name: "Documentation", url: "/documentation", description: "Internal note standards and checklists.", icon: "📚", tag: "Reference" },
  { name: "Feedback", url: "/feedback", description: "Report issues or suggest improvements.", icon: "📣", tag: "Maintenance" },
  { name: "Follow Up", url: "/follow-up", description: "Lead follow-up workflows.", icon: "📞", tag: "Sales" },
  { name: "Get Licensed", url: "/get-licensed", description: "Study guides and exam prep.", icon: "📜", tag: "Licensing" },
  { name: "Internet Leads", url: "/internet-leads", description: "Internet lead handling protocols.", icon: "🌐", tag: "Sales" },
  { name: "Licensing", url: "/licensing", description: "P&C and Life exam preparation.", icon: "🎓", tag: "Education" },
  { name: "Life Insurance", url: "/life", description: "Life insurance sales and service.", icon: "❤️", tag: "Sales" },
  { name: "P&C", url: "/pc", description: "Property and Casualty standards.", icon: "🏠", tag: "Sales" },
  { name: "Service", url: "/service", description: "Policy changes and claims.", icon: "🛠️", tag: "Support" },
  { name: "Signature", url: "/signature", description: "Email signature generator.", icon: "✍️", tag: "Tools" },
  { name: "Templates", url: "/templates", description: "Ready-to-copy forms and scripts.", icon: "📄", tag: "Sales" },
  { name: "Winback", url: "/winback", description: "Winback strategies for lost clients.", icon: "🔄", tag: "Sales" },
  { name: "Word Tracks", url: "/wordtrack", description: "Standardized scripts for team members.", icon: "💬", tag: "Sales" },
  { name: "X-Date", url: "/xdate", description: "X-Date tracking and follow-up.", icon: "📅", tag: "Sales" }
];

export const USER_DIRECTORY: UserDirectory = {
  "Mark": { full: "Mark Lusk", title: "Team Leader", email: "mark@daniellottinger.com", phone: "281.547.7209" },
  "Daniel": { full: "Daniel Lottinger", title: "Agency Owner", email: "daniel@daniellottinger.com", phone: "281.547.7209" },
  "Brittany": { full: "Brittany Montoro", title: "Service Lead", email: "brittany@daniellottinger.com", phone: "281.547.7209" },
  "Kamryn": { full: "Kamryn Raney", title: "Team Member", email: "kamryn@daniellottinger.com", phone: "281.547.7209" },
  "Robert": { full: "Robert Hood", title: "Team Member", email: "robert@daniellottinger.com", phone: "281.547.7209" },
  "Devin": { full: "Devin Cotton", title: "Team Member", email: "devin@daniellottinger.com", phone: "281.547.7209" },
  "Tyler": { full: "Tyler Jensen", title: "Team Member", email: "tyler@daniellottinger.com", phone: "281.547.7209" },
  "Elaina": { full: "Elaina Tumlinson", title: "Service Team Member", email: "elaina@daniellottinger.com", phone: "281.547.7209" }
};
