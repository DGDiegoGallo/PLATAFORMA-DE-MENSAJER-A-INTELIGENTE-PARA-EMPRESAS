import React from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  // Generate page items
  const getPageItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <BootstrapPagination.Item 
        key="prev" 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        &lt;&lt;
      </BootstrapPagination.Item>
    );
    
    // First page
    if (currentPage > 3) {
      items.push(
        <BootstrapPagination.Item 
          key={1} 
          onClick={() => onPageChange(1)}
        >
          1
        </BootstrapPagination.Item>
      );
      
      if (currentPage > 4) {
        items.push(<BootstrapPagination.Ellipsis key="ellipsis1" />);
      }
    }
    
    // Pages around current page
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <BootstrapPagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => onPageChange(i)}
        >
          {i}
        </BootstrapPagination.Item>
      );
    }
    
    // Last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        items.push(<BootstrapPagination.Ellipsis key="ellipsis2" />);
      }
      
      items.push(
        <BootstrapPagination.Item 
          key={totalPages} 
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </BootstrapPagination.Item>
      );
    }
    
    // Next button
    items.push(
      <BootstrapPagination.Item 
        key="next" 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        &gt;&gt;
      </BootstrapPagination.Item>
    );
    
    return items;
  };
  
  return (
    <div className="d-flex justify-content-center mt-4">
      <BootstrapPagination className="custom-pagination">
        {getPageItems()}
      </BootstrapPagination>
    </div>
  );
};

export default Pagination;
