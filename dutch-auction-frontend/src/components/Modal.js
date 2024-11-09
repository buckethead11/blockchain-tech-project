// components/Modal.js
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="bg-primary p-6 rounded-lg z-10 max-w-2xl w-full mx-4">
          {children}
          <button 
            onClick={onClose} 
            className="mt-4 bg-accent text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  };
  
  export default Modal;