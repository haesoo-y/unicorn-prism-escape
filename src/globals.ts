const element = document.querySelector('#game');

if (!(element instanceof HTMLCanvasElement)) {
  throw new Error('Canvas not found');
}

const renderingContext = element.getContext('2d');

if (!renderingContext) {
  throw new Error('2D context not available');
}

export const canvas = element;
export const context = renderingContext;
