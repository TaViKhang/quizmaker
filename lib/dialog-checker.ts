/**
 * Dialog Accessibility Checker
 * 
 * Utility to check if DialogContent components are used with DialogTitle
 * for accessibility. Only active in development mode.
 */

const checkDialogs = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Run after DOM is loaded
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        // Find all DialogContent elements
        const dialogContents = document.querySelectorAll('[role="dialog"]');
        
        dialogContents.forEach((dialog) => {
          // Check if there's a DialogTitle inside
          const hasTitle = Boolean(dialog.querySelector('[id^="radix-:"]'));
          
          if (!hasTitle) {
            console.warn(
              `Accessibility Warning: DialogContent detected without DialogTitle. ` +
              `Every DialogContent should have a DialogTitle for screen reader accessibility. ` +
              `If you don't want to show the title visually, wrap it with the sr-only class or use AccessibleDialogContent component.`
            );
          }
        });
      }, 1000); // Delay to ensure all components are mounted
    });
  }
};

// Export the function to run in _app.tsx or similar
export default checkDialogs; 