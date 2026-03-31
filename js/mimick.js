const lightbox = document.getElementById("screenshot-lightbox");
const lightboxImage = lightbox?.querySelector(".lightbox-image");
const lightboxCaption = lightbox?.querySelector(".lightbox-caption");
const lightboxClose = lightbox?.querySelector(".lightbox-close");
const screenshotTriggers = document.querySelectorAll(".screenshot-trigger");

if (lightbox && lightboxImage && lightboxCaption && lightboxClose && screenshotTriggers.length) {
  const frame = lightbox.querySelector(".lightbox-frame");

  const closeLightbox = () => {
    lightbox.close();
  };

  screenshotTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      lightboxImage.src = trigger.dataset.fullscreenImage || "";
      lightboxImage.alt = trigger.dataset.fullscreenAlt || "";
      lightboxCaption.textContent = trigger.dataset.fullscreenCaption || "";
      lightbox.showModal();
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (frame && !frame.contains(event.target)) {
      closeLightbox();
    }
  });

  lightbox.addEventListener("close", () => {
    lightboxImage.src = "./icon.png";
    lightboxImage.alt = "";
    lightboxCaption.textContent = "";
  });
}
