<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TemplateMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $mailTitle;
    public string $mailMessage;
    public ?string $pdfPath;

    public function __construct(string $title, string $message, ?string $pdfPath = null)
    {
        $this->mailTitle = $title;
        $this->mailMessage = $message;
        $this->pdfPath = $pdfPath;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->mailTitle,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.notification',
            with: [
                'mailTitle' => $this->mailTitle,
                'mailMessage' => $this->mailMessage,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        if ($this->pdfPath && file_exists($this->pdfPath)) {
            return [
                \Illuminate\Mail\Mailables\Attachment::fromPath($this->pdfPath)
            ];
        }
        return [];
    }
}
