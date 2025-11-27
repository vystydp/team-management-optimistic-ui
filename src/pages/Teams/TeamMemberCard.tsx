import React from 'react';
import { Button } from 'react-aria-components';
import { TeamMember } from '../../types/team';

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
    bg-white/90 backdrop-blur-sm rounded-porsche-lg shadow-porsche-md border border-porsche-silver p-6 transition-all duration-300
    ${isOptimistic ? 'opacity-70 ring-2 ring-optimistic-pending ring-offset-2' : 'hover:shadow-porsche-lg hover:border-porsche-neutral-300 hover:scale-[1.02]'}
  `;

  return (
    <div className={cardClasses} data-testid={`team-member-card-${member.id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-porsche-black tracking-tight">{member.name}</h3>
            <span
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                ${member.status === 'active' 
                  ? 'bg-green-100 text-green-800 ring-1 ring-green-600/30' 
                  : 'bg-porsche-neutral-100 text-porsche-neutral-700 ring-1 ring-porsche-neutral-600/30'}
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-green-600' : 'bg-porsche-neutral-500'}`}></span>
              {member.status === 'active' ? 'Active' : 'Inactive'}
            </span>
            {isOptimistic && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-optimistic-pending/10 text-optimistic-pending ring-1 ring-optimistic-pending/30 animate-pulse">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Pending
              </span>
            )}
          </div>
          
          <p className="text-sm text-porsche-neutral-600 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-porsche-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {member.email}
          </p>
        </div>
      </div>
      
      <div className="space-y-3 py-4 border-t border-porsche-silver">
        <div className="flex items-center gap-3 text-sm">
          <svg className="w-4 h-4 text-porsche-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="font-semibold text-porsche-black min-w-[90px] uppercase text-xs tracking-wide">Role</span>
          <span className="text-porsche-neutral-700">{member.role}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <svg className="w-4 h-4 text-porsche-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="font-semibold text-porsche-black min-w-[90px] uppercase text-xs tracking-wide">Department</span>
          <span className="text-porsche-neutral-700">{member.department}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-porsche-silver">
        <Button
          onPress={() => onEdit(member)}
          isDisabled={isOptimistic}
          className="flex-1 px-4 py-2.5 bg-console-primary text-white rounded-porsche hover:bg-console-primary-soft pressed:bg-console-primary-dark active:scale-95 transition-all text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 shadow-porsche-sm"
        >
          Edit
        </Button>
        <Button
          onPress={() => onToggleStatus(member.id)}
          isDisabled={isOptimistic}
          className="flex-1 px-4 py-2.5 bg-white border-2 border-porsche-silver text-porsche-black rounded-porsche hover:bg-porsche-neutral-50 hover:border-porsche-neutral-400 pressed:bg-porsche-neutral-100 transition-all text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2"
        >
          Toggle
        </Button>
        <Button
          onPress={() => onDelete(member.id)}
          isDisabled={isOptimistic}
          className="px-4 py-2.5 bg-white border-2 border-porsche-red/30 text-porsche-red rounded-porsche hover:bg-porsche-red/5 hover:border-porsche-red pressed:bg-porsche-red/10 transition-all text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-porsche-red focus:ring-offset-2"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
