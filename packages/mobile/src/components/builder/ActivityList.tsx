import React, { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { DayPlan, ItineraryItem } from '@nextdestination/shared';
import { ActivityCard } from './ActivityCard';
import { MobileButton } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';

interface SortableActivityProps {
  activity: ItineraryItem;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}

const SortableActivity: React.FC<SortableActivityProps> = ({
  activity,
  index,
  onPress,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id || `activity-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ActivityCard
        activity={activity}
        index={index}
        onPress={onPress}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
};

interface ActivityListProps {
  day: DayPlan;
  dayIndex: number;
  onActivityPress: (activityIndex: number) => void;
  onActivityDelete: (activityIndex: number) => void;
  onActivityReorder: (oldIndex: number, newIndex: number) => void;
  onAddActivity: () => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  day,
  dayIndex,
  onActivityPress,
  onActivityDelete,
  onActivityReorder,
  onAddActivity,
}) => {
  const haptic = useHaptic();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = async (event: DragStartEvent) => {
    await haptic.medium();
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    await haptic.light();
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = day.activities.findIndex(
        (a) => (a.id || `activity-${day.activities.indexOf(a)}`) === active.id
      );
      const newIndex = day.activities.findIndex(
        (a) => (a.id || `activity-${day.activities.indexOf(a)}`) === over.id
      );
      onActivityReorder(oldIndex, newIndex);
    }
  };

  const activeActivity = activeId
    ? day.activities.find((a, i) => (a.id || `activity-${i}`) === activeId)
    : null;

  if (day.activities.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No activities yet</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          Start planning Day {day.day} by adding your first activity
        </p>
        <MobileButton onClick={onAddActivity} icon={<Plus className="w-5 h-5" />}>
          Add Activity
        </MobileButton>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Day Theme */}
      <div className="mb-4">
        <span className="text-sm text-blue-600 font-medium">{day.theme}</span>
      </div>

      {/* Activities */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={day.activities.map((a, i) => a.id || `activity-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {day.activities.map((activity, index) => (
              <SortableActivity
                key={activity.id || `activity-${index}`}
                activity={activity}
                index={index}
                onPress={() => onActivityPress(index)}
                onDelete={() => onActivityDelete(index)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeActivity ? (
            <ActivityCard
              activity={activeActivity}
              index={day.activities.indexOf(activeActivity)}
              onPress={() => {}}
              onDelete={() => {}}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Activity Button */}
      <div className="mt-4">
        <MobileButton
          variant="secondary"
          fullWidth
          onClick={onAddActivity}
          icon={<Plus className="w-5 h-5" />}
        >
          Add Activity
        </MobileButton>
      </div>
    </div>
  );
};
