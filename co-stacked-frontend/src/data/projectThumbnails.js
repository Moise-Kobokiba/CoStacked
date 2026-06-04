export const projectThumbnails = [
  { id: 'orange', label: 'Orange Gradient', src: '/assets/project-thumbnails/orange.svg' },
  { id: 'red', label: 'Red Gradient', src: '/assets/project-thumbnails/red.svg' },
  { id: 'green', label: 'Green Gradient', src: '/assets/project-thumbnails/green.svg' },
  { id: 'purple', label: 'Purple Gradient', src: '/assets/project-thumbnails/purple.svg' },
  { id: 'blue', label: 'Blue Gradient', src: '/assets/project-thumbnails/blue.svg' },
];

const allowedThumbnails = projectThumbnails.map((item) => item.src);

export const getProjectThumbnail = (project) => {
  if (project?.thumbnail && allowedThumbnails.includes(project.thumbnail)) {
    return project.thumbnail;
  }

  const seed = `${project?._id || project?.title || project?.category || 'default'}`;
  const value = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return projectThumbnails[value % projectThumbnails.length].src;
};

export const thumbnailOptions = projectThumbnails.map((item) => item.src);
