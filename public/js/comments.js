/**
 * Comments module for mcptix
 * Handles rendering and managing comments on tickets
 */

import { Storage } from './storage.js';

// Comment authors
const COMMENT_AUTHORS = {
  DEVELOPER: 'developer',
  AGENT: 'agent',
};

/**
 * Load comments for a ticket
 * @param {HTMLElement} container - The container to render comments in
 * @param {object} ticket - The ticket to load comments for
 * @returns {Promise} A promise that resolves when comments are loaded
 */
function loadComments(container, ticket) {
  if (!container || !ticket) {
    return Promise.resolve();
  }

  // Clear the container
  container.innerHTML = '<div class="comments-loading">Loading comments...</div>';

  // Get comments from the API
  return Storage.getComments(ticket.id)
    .then(comments => {
      // Clear the container
      container.innerHTML = '';

      // Check if ticket has comments
      if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="comments-empty">No comments yet</div>';
        return;
      }

      // Sort comments by timestamp (oldest first)
      const sortedComments = [...comments].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });

      // Render each comment
      sortedComments.forEach(comment => {
        renderComment(container, comment);
      });
    })
    .catch(error => {
      console.error('Error loading comments:', error);
      container.innerHTML = '<div class="comments-error">Error loading comments</div>';
    });
}

/**
 * Clear comments from a container
 * @param {HTMLElement} container - The container to clear comments from
 */
function clearComments(container) {
  if (container) {
    container.innerHTML = '<div class="comments-empty">No comments yet</div>';
  }
}

/**
 * Render a single comment
 * @param {HTMLElement} container - The container to render the comment in
 * @param {object} comment - The comment to render
 */
function renderComment(container, comment) {
  // Create comment element
  const commentElement = document.createElement('div');
  commentElement.className = `comment comment-author-${comment.author}`;
  commentElement.dataset.id = comment.id;

  // Format timestamp
  const timestamp = new Date(comment.timestamp).toLocaleString();

  // Get author label
  const authorLabel = comment.author === COMMENT_AUTHORS.DEVELOPER ? 'Developer' : 'Agent';

  // Create comment header
  const headerHTML = `
    <div class="comment-header">
      <span class="comment-author-badge">${authorLabel}</span>
      <span class="comment-timestamp">${timestamp}</span>
    </div>
  `;

  // Create comment content with markdown support
  let contentHTML = '';

  if (comment.author === COMMENT_AUTHORS.AGENT) {
    // For agent comments, implement client-side expand/collapse
    // First paragraph or first 100 characters as summary
    let summary = '';
    let fullContent = comment.content || '';

    const firstParagraphMatch = fullContent.match(/^(.*?)(\n\n|\n|$)/);
    if (firstParagraphMatch && firstParagraphMatch[1]) {
      summary = firstParagraphMatch[1];
      // If summary is too long, truncate it
      if (summary.length > 150) {
        summary = summary.substring(0, 147) + '...';
      }
    } else {
      summary = fullContent.length > 150 ? fullContent.substring(0, 147) + '...' : fullContent;
    }

    // Create a collapsible content section
    contentHTML = `
      <div class="comment-content">
        <div class="comment-summary">${summary}</div>
        <div class="comment-full-text collapsed">
          <div class="markdown-content"></div>
        </div>
        ${fullContent.length > summary.length ? '<button type="button" class="toggle-full-text-btn">Show More</button>' : ''}
      </div>
    `;
  } else {
    // Developer comment - simple rendering
    contentHTML = `<div class="comment-content">${comment.content || ''}</div>`;
  }

  // Set comment HTML - no actions section needed
  commentElement.innerHTML = headerHTML + contentHTML;

  // Add to container
  container.appendChild(commentElement);

  // Render markdown for all comments
  const markdownContainer = commentElement.querySelector('.markdown-content');
  if (markdownContainer && typeof marked !== 'undefined') {
    try {
      markdownContainer.innerHTML = marked.parse(comment.content || '');
    } catch (error) {
      console.error('Error parsing markdown:', error);
      markdownContainer.innerHTML = comment.content || '';
    }
  }

  // Add toggle button event listener
  const toggleButton = commentElement.querySelector('.toggle-full-text-btn');
  const fullTextContainer = commentElement.querySelector('.comment-full-text');

  if (toggleButton && fullTextContainer) {
    toggleButton.addEventListener('click', () => {
      const isCollapsed = fullTextContainer.classList.contains('collapsed');
      fullTextContainer.classList.toggle('collapsed');
      toggleButton.textContent = isCollapsed ? 'Show Less' : 'Show More';
    });
  }
}

/**
 * Add a comment to a ticket
 * @param {string} ticketId - The ID of the ticket to add the comment to
 * @param {string} content - The content of the comment
 * @returns {Promise} A promise that resolves when the comment is added
 */
function addComment(ticketId, content) {
  // Create the comment object
  const comment = {
    content,
    author: COMMENT_AUTHORS.DEVELOPER,
  };

  // Add the comment using the Storage API
  return Storage.addComment(ticketId, comment);
}

// Export the module functions and constants
export const Comments = {
  loadComments,
  clearComments,
  addComment,
  COMMENT_AUTHORS,
};
