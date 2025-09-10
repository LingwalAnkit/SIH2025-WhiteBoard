import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSharedWebsite, resetSharingState } from '../store/websiteSlice';
import { emitWebsiteClosed } from '../socketConn/socketConn';

const WebsiteDisplay = ({ roomID, userID }) => {
  const dispatch = useDispatch();
  const { websiteUrl, isDisplaying, sharedBy } = useSelector((state) => state.website);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Automatically focus the iframe when it becomes visible
    if (isDisplaying && iframeRef.current) {
      iframeRef.current.focus();
    }
  }, [isDisplaying]);

  if (!isDisplaying || !websiteUrl) {
    return null;
  }

  const handleClose = () => {
    dispatch(closeSharedWebsite());
    dispatch(resetSharingState()); // Reset sharing state when closing the website display
    // This will reset both isDisplaying and isSharing in the Redux store
    emitWebsiteClosed({ roomID, userID });
  };

  return (
    <div className="website-display-container">
      <div className="website-display-header">
        <div className="website-info">
          <span className="website-url">{websiteUrl}</span>
          <span className="website-shared-by">Shared by: {sharedBy}</span>
        </div>
        <button className="close-button" onClick={handleClose}>
          Close
        </button>
      </div>
      <div className="website-iframe-container">
        <iframe
          ref={iframeRef}
          src={websiteUrl}
          title="Shared Website"
          className="website-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>
    </div>
  );
};

export default WebsiteDisplay;