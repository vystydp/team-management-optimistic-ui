import React from 'react';
import { TeamMember } from '../types/team';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isOptimistic?: boolean;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  onEdit,
  onDelete,
  onToggleStatus,
  isOptimistic = false,
}) => {
  const cardClasses = `
    bg-white rounded-lg shadow-md p-6 transition-all duration-300
    ${isOptimistic ? 'opacity-70 border-2 border-yellow-300' : 'hover:shadow-lg'}
  `;

  return (
    <div className={cardClasses} data-testid={`team-member-card-${member.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
            <span
              className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
              `}
            >
              {member.status}
            </span>
            {isOptimistic && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending...
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-1">{member.email}</p>
          
          <div className="mt-4 space-y-1">
            <p className="text-sm">
              <span className="font-medium text-gray-700">Role:</span>{' '}
              <span className="text-gray-600">{member.role}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Department:</span>{' '}
              <span className="text-gray-600">{member.department}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => onEdit(member)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isOptimistic}
        >
          Edit
        </button>
        <button
          onClick={() => onToggleStatus(member.id)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isOptimistic}
        >
          Toggle Status
        </button>
        <button
          onClick={() => onDelete(member.id)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isOptimistic}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
