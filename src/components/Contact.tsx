import { contact } from '@/data/content';

export default function Contact() {
  return (
    <section id="contact" className="section-container">
      <h2 className="section-title">Get in Touch</h2>
      <p className="section-subtitle max-w-lg">
        Whether you&apos;re hiring, need AI consulting, or want to collaborate — I&apos;d like to
        hear from you.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <a href={`mailto:${contact.email}`} className="btn-primary">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          {contact.email}
        </a>
        <a
          href={contact.github}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
        >
          GitHub
        </a>
        <a
          href={contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
        >
          LinkedIn
        </a>
      </div>

      <p className="text-sm text-text-secondary mt-8">{contact.location}</p>
    </section>
  );
}
