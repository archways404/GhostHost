import React from 'react';
import { Link } from 'react-router-dom';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function DevDrawer() {
	return (
		<div className="flex flex-col items-center justify-center p-4">
			<div className="flex space-x-6 text-sm pb-1">
				<Drawer>
					<DrawerTrigger>
						<div className="hover:text-green-500">Credits</div>
					</DrawerTrigger>
					<DrawerContent>
						<DrawerHeader>
							<DrawerDescription>
								<div className="text-center">
									<p className="pt-2">
										<span className="font-bold">GhostHost</span> is a free and
										open source project.
									</p>
									<p className="pt-2">
										The application is currently maintained by{' '}
										<span className="font-bold">archways404</span>
									</p>
								</div>
							</DrawerDescription>
						</DrawerHeader>
						<DrawerFooter className="flex justify-end">
							<DrawerClose>
								<Button variant="outline">Close</Button>
							</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
				<Drawer>
					<DrawerTrigger>
						<div className="hover:text-green-500">Terms & Conditions</div>
					</DrawerTrigger>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Terms & Conditions</DrawerTitle>
							<DrawerDescription>
								<div className="text-sm space-y-2 p-2">
									<p>
										Welcome to GhostHost. These terms and conditions outline the
										rules and regulations for the use of our website and
										services.
									</p>
									<h3 className="font-bold">Introduction</h3>
									<p>
										By accessing this website, you accept these terms and
										conditions in full. Do not continue to use GhostHost if you
										do not accept all of the terms and conditions stated on this
										page.
									</p>
									<h3 className="font-bold">License</h3>
									<p>
										GhostHost is free and open source software licensed under
										the MIT License. You are free to use, copy, modify, merge,
										publish, distribute, sublicense, and/or sell copies of the
										Software, subject to the following conditions:
									</p>
									<p>
										The above copyright notice and this permission notice shall
										be included in all copies or substantial portions of the
										Software.
									</p>
									<p>
										THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
										KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
										WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
										PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
										OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
										OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
										OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
										SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
									</p>
									<h3 className="font-bold">User Comments</h3>
									<p>
										Certain parts of this website offer the opportunity for
										users to post and exchange opinions, information, material,
										and data ('Comments'). GhostHost does not screen, edit,
										publish or review Comments prior to their appearance on the
										website, and Comments do not reflect the views or opinions
										of GhostHost, its agents, or affiliates. Comments reflect
										the view and opinion of the person who posts such view or
										opinion.
									</p>
									<h3 className="font-bold">Hyperlinking to our Content</h3>
									<p>
										The following organizations may link to our website without
										prior written approval: Government agencies; Search engines;
										News organizations; Online directory distributors when they
										list us in the directory may link to our website in the same
										manner as they hyperlink to the websites of other listed
										businesses; and Systemwide Accredited Businesses except
										soliciting non-profit organizations, charity shopping malls,
										and charity fundraising groups which may not hyperlink to
										our website.
									</p>
								</div>
							</DrawerDescription>
						</DrawerHeader>
						<DrawerFooter className="flex justify-end">
							<DrawerClose>
								<Button variant="outline">Close</Button>
							</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			</div>
			<Separator className="w-2/5" />
			<p className="text-center text-sm pt-1">
				© 2024 Software404™. All Rights Reserved.
			</p>
		</div>
	);
}

export default DevDrawer;
