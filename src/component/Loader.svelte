<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <g fill="#212121">
    <circle cx="1.5" cy="8" r="1.5"></circle>
    <circle cx="8" cy="8" r="1.5"></circle>
    <circle cx="14.5" cy="8" r="1.5"></circle>
  </g>
</svg>

<style>
  g > circle {
    transform-origin: 50% 50%;
    animation: loop 0.8s infinite;
  }

  g > :nth-child(2) {
    animation-delay: 0.1s;
  }

  g > :nth-child(3) {
    animation-delay: 0.2s;
  }

  @keyframes loop {
    0%,
    100%,
    60% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(20%);
    }
  }
</style>
