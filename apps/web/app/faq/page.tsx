import Link from 'next/link';

const faqs = [
  {
    question: 'Can messages be recovered after disappearing?',
    answer: 'No. Once a message is opened or expires, it is permanently deleted and cannot be recovered.',
  },
  {
    question: 'How does encryption work in this tool?',
    answer: 'Your message is encrypted directly in your browser before it is sent to the server. The server only stores the encrypted version.',
  },
  {
    question: 'Can the server read my message?',
    answer: 'No. The server only receives encrypted data and cannot decrypt it.',
  },
  {
    question: 'Where is the encryption key stored?',
    answer: 'The encryption key is stored in the URL fragment and never sent to the server.',
  },
  {
    question: 'What is AES-GCM and how is it used here?',
    answer: 'AES-GCM is a modern encryption standard that ensures confidentiality and integrity of your message.',
  },
  {
    question: 'Is this tool anonymous?',
    answer: 'The tool minimizes data collection and avoids tracking, but complete anonymity cannot be guaranteed at the network level.',
  },
  {
    question: 'Does this tool log IP addresses or user activity?',
    answer: 'The application does not store identifiable user data. Some short-lived data may be used to prevent abuse.',
  },
  {
    question: 'Can messages be copied or screenshotted?',
    answer: 'Yes. Once displayed, messages can be copied or captured.',
  },
  {
    question: 'What happens if I lose the link?',
    answer: 'The message cannot be recovered without the original link.',
  },
  {
    question: 'What happens if I refresh the page?',
    answer: 'Messages are consumed on first access and cannot be viewed again.',
  },
  {
    question: 'What information is stored on the server?',
    answer: 'Only encrypted data and expiration metadata.',
  },
  {
    question: 'How long are messages stored if never opened?',
    answer: 'Messages expire automatically after 1 hour, 6 hours, or 24 hours.',
  },
];

export default function FAQPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-10 text-3xl font-semibold text-white">FAQs</h1>
      <div className="space-y-8">
        {faqs.map((faq, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-base font-medium text-white">{faq.question}</h3>
            <p className="text-sm leading-relaxed text-slate-300">{faq.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <Link className="text-sm text-cyan-400 hover:underline" href="/">
          Back to create a new secure note.
        </Link>
      </div>
    </main>
  );
}
