'use strict';

/**
 * CustomPagination - A reusable pagination component with pinned jump buttons
 * 
 * Features:
 * - Jump to first/last buttons pinned to left/right edges (always visible, disabled when not applicable)
 * - Page numbers left-aligned in center
 * - Smart defaults for boundary/sibling ranges based on total pages
 * - Automatically hides when there's only one page
 * - Consistent Semantic UI styling throughout
 * 
 * Usage:
 * <CustomPagination
 *   activePage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={(event, { activePage }) => setCurrentPage(activePage)}
 *   style={{ marginTop: '1rem' }}
 *   disabled={loading}
 * />
 * 
 * Props:
 * - activePage (number, required): Current active page
 * - totalPages (number, required): Total number of pages
 * - onPageChange (function, required): Callback when page changes
 * - boundaryRange (number, optional): Pages shown at start/end
 * - siblingRange (number, optional): Pages shown around current page
 * - showEllipsis (boolean, optional): Whether to show ellipsis
 * - showPreviousAndNextNav (boolean, optional): Show prev/next buttons
 * - style (object, optional): Additional styles
 * - className (string, optional): Additional CSS classes
 * - disabled (boolean, optional): Disable all buttons
 */

const React = require('react');
const {
  Button,
  Icon,
  Pagination
} = require('semantic-ui-react');

class CustomPagination extends React.Component {
  render() {
    const {
      activePage,
      totalPages,
      onPageChange,
      boundaryRange,
      siblingRange,
      showEllipsis,
      showPreviousAndNextNav = true,
      style = {},
      className = '',
      disabled = false
    } = this.props;

    // Don't render if there's only one page or no pages
    if (totalPages <= 1) {
      return null;
    }

    // Calculate smart defaults for boundary and sibling ranges if not provided
    const defaultBoundaryRange = boundaryRange !== undefined ? boundaryRange : (totalPages <= 10 ? totalPages : 2);
    const defaultSiblingRange = siblingRange !== undefined ? siblingRange : (totalPages <= 15 ? totalPages : 3);
    const defaultShowEllipsis = showEllipsis !== undefined ? showEllipsis : (totalPages > 15);

    return (
      <div style={{ 
        width: '100%', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style
      }} className={className}>
        {/* Left side: Jump to first button */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            icon
            disabled={disabled || activePage <= 1}
            onClick={(e) => onPageChange(e, { activePage: 1 })}
            style={{ marginRight: '0.5rem' }}
            title="Jump to first page"
            className="ui button"
          >
            <Icon name="angle double left" />
          </Button>
        </div>

        {/* Center: Page numbers stacked to left */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-start',
          flex: 1
        }}>
          <Pagination
            activePage={activePage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            boundaryRange={defaultBoundaryRange}
            siblingRange={defaultSiblingRange}
            showEllipsis={defaultShowEllipsis}
            showFirstAndLastNav={false}
            showPreviousAndNextNav={showPreviousAndNextNav}
            prevItem={activePage === 1 ? null : undefined}
            nextItem={activePage === totalPages ? null : undefined}
            disabled={disabled}
            className="ui pagination menu"
          />
        </div>

        {/* Right side: Jump to last button */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            icon
            disabled={disabled || activePage >= totalPages}
            onClick={(e) => onPageChange(e, { activePage: totalPages })}
            style={{ marginLeft: '0.5rem' }}
            title="Jump to last page"
            className="ui button"
          >
            <Icon name="angle double right" />
          </Button>
        </div>
      </div>
    );
  }
}

module.exports = CustomPagination; 