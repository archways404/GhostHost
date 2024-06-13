import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';

function Acc() {
	return (
		<div className="grid grid-cols-2 gap-4">
			<Accordion
				type="single"
				collapsible>
				<AccordionItem value="item-1">
					<AccordionTrigger>How much does it cost?</AccordionTrigger>
					<AccordionContent>
						<p className="pb-2">
							<span className="font-bold">GhostHost</span> is a free and open
							source project and will <span className="font-bold">never</span>{' '}
							cost you anything.
						</p>
						<p>That being said, we do accept donations.</p>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-2">
					<AccordionTrigger>Who can download the files?</AccordionTrigger>
					<AccordionContent>
						<p className="pb-2">
							At the moment,
							<span className="font-bold"> anyone with the link </span>
							is able to download the shared file(s).
						</p>
						<p className="pb-2">
							We are working on adding encryption and password protection.
						</p>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-3">
					<AccordionTrigger>How does it work?</AccordionTrigger>
					<AccordionContent>Placeholder</AccordionContent>
				</AccordionItem>
			</Accordion>
			<Accordion
				type="single"
				collapsible>
				<AccordionItem value="item-4">
					<AccordionTrigger>Is it accessible?</AccordionTrigger>
					<AccordionContent>
						Yes. It adheres to the WAI-ARIA design pattern.
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-5">
					<AccordionTrigger>Is it accessible?</AccordionTrigger>
					<AccordionContent>
						Yes. It adheres to the WAI-ARIA design pattern.
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-6">
					<AccordionTrigger>Is it accessible?</AccordionTrigger>
					<AccordionContent>
						Yes. It adheres to the WAI-ARIA design pattern.
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

export default Acc;
