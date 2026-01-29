'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { X } from 'lucide-react';

const STORAGE_KEY = 'event_banner_dismissed';

const EventBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const event = useQuery(api.events.getActiveEvent);

  useEffect(() => {
    if (!event) return;

    // Kiểm tra session storage - nếu đã dismiss trong session này thì không hiện
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed === event._id) return;

    // Kiểm tra date validation phía client
    const now = Date.now();
    if (event.startDate > now || event.endDate < now) return;

    // Hiển thị popup
    setIsOpen(true);
  }, [event]);

  const handleClose = () => {
    if (event) {
      // Lưu vào sessionStorage - sẽ reset khi đóng tất cả tab
      sessionStorage.setItem(STORAGE_KEY, event._id);
    }
    setIsOpen(false);
  };

  // Không render nếu không có event hoặc đã đóng
  if (!isOpen || !event || !event.imageUrl) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 z-50 animate-fadeIn"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative max-w-md w-full pointer-events-auto animate-slideUp">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          {/* Event Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default EventBanner;
